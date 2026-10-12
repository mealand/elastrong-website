/* ==========================================================================
   Elastrong Cares Foundation — interactions & motion
   Vanilla JS, no dependencies. Every feature is opt-in via data attributes.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const html = document.documentElement;
  const CFG = window.ECF_CONFIG || {};
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isDesktop = () => innerWidth > 900;
  if (reduceMotion) html.classList.add('reduce-motion');

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };
  const naira = n => '₦' + Math.round(n).toLocaleString('en-NG');

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('.toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-shown'), 3200);
  }

  /* ---------- Media slots & placeholders ---------- */
  const PH = [
    ['#1a6b4f', '#f4a83a'], ['#0f3d2e', '#e8643c'], ['#3fa37b', '#fde7c2'],
    ['#e8643c', '#f4a83a'], ['#14513d', '#9fd3b8'], ['#0b2e23', '#f4a83a'],
  ];
  function initMedia() {
    $$('.media').forEach((m, i) => {
      const [a, b] = PH[i % PH.length];
      m.style.setProperty('--ph-a', a);
      m.style.setProperty('--ph-b', b);
      const img = $(':scope > img', m);
      const vid = $(':scope > video', m);
      const missing = () => m.classList.add('is-missing');
      const loaded = () => m.classList.add('is-loaded');
      if (img) {
        if (img.complete) (img.naturalWidth ? loaded : missing)();
        img.addEventListener('load', loaded);
        img.addEventListener('error', missing);
      }
      if (vid) {
        m.dataset.kind = 'video';
        const sources = $$('source', vid);
        sources.forEach(s => s.addEventListener('error', () => {
          if (s === sources[sources.length - 1]) missing();
        }));
        vid.addEventListener('error', missing);
        vid.addEventListener('loadeddata', loaded);
        if (vid.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) missing();
        if (vid.readyState >= 2) loaded();
      }
      if (!img && !vid) missing();
    });

    // Partner logos
    $$('.logo-tile img').forEach(img => {
      const tile = img.parentElement;
      const missing = () => tile.classList.add('is-missing');
      if (img.complete && !img.naturalWidth) missing();
      img.addEventListener('error', missing);
    });

    // Autoplay videos only while visible (saves data on mobile)
    const vids = $$('video[data-autoplay], .hero__bg video');
    if (!vids.length) return;
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting && !reduceMotion) { v.muted = true; v.play().catch(() => {}); }
      else v.pause();
    }), { threshold: .15 });
    vids.forEach(v => io.observe(v));
  }

  /* ---------- Preloader & page curtain ---------- */
  function initLoader() {
    const pl = $('.preloader');
    const firstVisit = !store.get('ecf-visited');
    store.set('ecf-visited', '1');

    if (!pl || !firstVisit || reduceMotion) {
      pl && pl.remove();
      requestAnimationFrame(() => html.classList.add('is-ready'));
      return Promise.resolve();
    }
    $('.curtain') && ($('.curtain').style.display = 'none');
    const count = $('[data-preload-count]', pl);
    const duration = 1900;
    const start = performance.now();
    return new Promise(resolve => {
      const tick = now => {
        const p = clamp((now - start) / duration, 0, 1);
        if (count) count.textContent = Math.round((1 - Math.pow(1 - p, 3)) * 100);
        if (p < 1) return requestAnimationFrame(tick);
        pl.classList.add('is-done');
        html.classList.add('is-ready');
        setTimeout(resolve, 350);
        setTimeout(() => {
          pl.remove();
          const c = $('.curtain');
          if (c) c.style.display = '';
        }, 1100);
      };
      requestAnimationFrame(tick);
    });
  }

  function initTransitions() {
    if (reduceMotion) return;
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download') || a.dataset.lightbox !== undefined) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
      if (url.pathname === location.pathname && url.hash) return;
      e.preventDefault();
      html.classList.remove('is-ready');
      html.classList.add('is-leaving');
      setTimeout(() => { location.href = url.href; }, 650);
    });
    addEventListener('pageshow', e => {
      if (e.persisted) { html.classList.remove('is-leaving'); html.classList.add('is-ready'); }
    });
  }

  /* ---------- Header & mobile nav ---------- */
  function initHeader() {
    const header = $('.site-header');
    const burger = $('.burger');
    const panel = $('#mobile-nav');
    let lastY = scrollY;

    const onScroll = () => {
      const y = scrollY;
      header.classList.toggle('is-scrolled', y > 40);
      const goingDown = y > lastY && y > 400;
      if (!document.body.classList.contains('nav-open')) header.classList.toggle('is-hidden', goingDown);
      lastY = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const setOpen = open => {
      document.body.classList.toggle('nav-open', open);
      document.body.classList.toggle('no-scroll', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      panel.setAttribute('aria-hidden', !open);
    };
    burger && burger.addEventListener('click', () => setOpen(!document.body.classList.contains('nav-open')));
    $$('a', panel).forEach(a => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    addEventListener('resize', () => { if (innerWidth > 1100) setOpen(false); });
  }

  /* ---------- Split headings into animated words ---------- */
  function splitText(el) {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const parts = child.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'word';
            const inner = document.createElement('span');
            inner.className = 'word__inner';
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    $$('.word', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
  }

  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    return $$('.w', el);
  }

  /* ---------- Reveal on scroll ---------- */
  function prepareReveal() {
    $$('[data-stagger]').forEach(group => {
      $$(':scope > [data-reveal], :scope > * > [data-reveal]', group).forEach((el, i) => el.style.setProperty('--d', `${i * 90}ms`));
    });
    $$('[data-split]').forEach(splitText);
  }

  function initReveal() {
    const targets = $$('[data-reveal], [data-split]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-in'));
      return;
    }
    // Elements hidden with clip-path report zero visible area, so watch their parent instead.
    const watch = new Map();
    targets.forEach(el => {
      const node = el.dataset.reveal === 'clip' ? el.parentElement : el;
      if (!watch.has(node)) watch.set(node, []);
      watch.get(node).push(el);
    });
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      watch.get(e.target).forEach(el => el.classList.add('is-in'));
      io.unobserve(e.target);
    }), { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    watch.forEach((_, node) => io.observe(node));
  }

  /* ---------- Counters ---------- */
  function initCounters() {
    const els = $$('[data-count]');
    const run = el => {
      const target = parseFloat(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target.toLocaleString() + suffix; return; }
      const dur = 2200, t0 = performance.now();
      const step = now => {
        const p = clamp((now - t0) / dur, 0, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        el.textContent = Math.round(target * eased).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }), { threshold: .5 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Scroll-driven effects (one rAF loop) ---------- */
  function initScrollFx() {
    const parallax = $$('[data-parallax]');
    const highlights = $$('[data-highlight]').map(el => ({ el, words: splitWords(el) }));
    const hs = $$('[data-hscroll]').map(sec => ({ sec, track: $('.hscroll__track', sec) }));
    const timelines = $$('.timeline');
    const toTop = $('.to-top');
    const bar = $('.scroll-progress');

    const sizeHscroll = () => hs.forEach(({ sec, track }) => {
      if (!isDesktop() || reduceMotion) { sec.style.height = ''; track.style.transform = ''; return; }
      const dist = track.scrollWidth - innerWidth;
      sec.style.height = `${dist + innerHeight}px`;
      sec._dist = dist;
    });

    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = innerHeight;
      const docH = document.documentElement.scrollHeight - vh;
      const prog = docH > 0 ? scrollY / docH : 0;
      bar && bar.style.setProperty('--progress', prog);
      if (toTop) {
        toTop.style.setProperty('--progress', prog);
        toTop.classList.toggle('is-visible', scrollY > vh * .8);
      }

      if (!reduceMotion) {
        parallax.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const speed = parseFloat(el.dataset.parallax) || .15;
          const offset = (r.top + r.height / 2 - vh / 2) * speed;
          el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
        });

        hs.forEach(({ sec, track }) => {
          if (!isDesktop() || !sec._dist) return;
          const r = sec.getBoundingClientRect();
          const p = clamp(-r.top / (sec.offsetHeight - vh), 0, 1);
          track.style.transform = `translate3d(${-p * sec._dist}px, 0, 0)`;
        });
      }

      highlights.forEach(({ el, words }) => {
        const r = el.getBoundingClientRect();
        const p = clamp((vh * .85 - r.top) / (r.height + vh * .35), 0, 1);
        const lit = Math.round(p * words.length);
        words.forEach((w, i) => w.classList.toggle('is-lit', i < lit));
      });

      timelines.forEach(tl => {
        const r = tl.getBoundingClientRect();
        tl.style.setProperty('--tl', clamp((vh * .6 - r.top) / r.height, 0, 1));
      });
    };
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

    sizeHscroll();
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', () => { sizeHscroll(); request(); });
    addEventListener('load', () => { sizeHscroll(); request(); });
    update();

    toTop && toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  }

  /* ---------- Marquee: duplicate content for a seamless loop ---------- */
  function initMarquee() {
    $$('.marquee__track').forEach(track => {
      const group = $('.marquee__group', track);
      if (!group) return;
      const clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }

  /* ---------- Tilt cards & magnetic buttons ---------- */
  function initPointerFx() {
    if (!finePointer || reduceMotion) return;
    $$('[data-tilt]').forEach(el => {
      el.parentElement.classList.add('tilt-host');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transform = `rotateX(${(.5 - y) * 10}deg) rotateY(${(x - .5) * 10}deg) translateY(-6px)`;
        el.style.setProperty('--gx', `${x * 100}%`);
        el.style.setProperty('--gy', `${y * 100}%`);
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * .25}px, ${y * .35}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    const c = document.createElement('div');
    c.className = 'cursor is-hidden';
    c.innerHTML = '<div class="cursor__ring"><span></span></div><div class="cursor__dot"></div>';
    document.body.appendChild(c);
    const ring = $('.cursor__ring', c), dot = $('.cursor__dot', c), label = $('span', ring);
    let mx = 0, my = 0, rx = 0, ry = 0;
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
      c.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.add('is-hidden'));
    const loop = () => {
      rx += (mx - rx) * .18; ry += (my - ry) * .18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener('pointerover', e => {
      const labelled = e.target.closest('[data-cursor]');
      const hover = e.target.closest('a, button, input, textarea, select, label');
      c.classList.toggle('is-label', !!labelled);
      c.classList.toggle('is-hover', !labelled && !!hover);
      label.textContent = labelled ? labelled.dataset.cursor : '';
    });
  }

  /* ---------- Lightbox (images, local video, YouTube) ---------- */
  const Lightbox = (() => {
    let el, stage, cap, count, items = [], idx = 0, lastFocus;
    const build = () => {
      el = document.createElement('div');
      el.className = 'lightbox';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-label', 'Media viewer');
      el.innerHTML = `
        <div class="lightbox__stage"></div>
        <p class="lightbox__caption"></p>
        <p class="lightbox__count"></p>
        <button class="lightbox__btn lightbox__close" aria-label="Close"><svg class="icon"><use href="#i-close"/></svg></button>
        <button class="lightbox__btn lightbox__prev" aria-label="Previous"><svg class="icon"><use href="#i-chev-left"/></svg></button>
        <button class="lightbox__btn lightbox__next" aria-label="Next"><svg class="icon"><use href="#i-chev-right"/></svg></button>`;
      document.body.appendChild(el);
      stage = $('.lightbox__stage', el); cap = $('.lightbox__caption', el); count = $('.lightbox__count', el);
      $('.lightbox__close', el).addEventListener('click', close);
      $('.lightbox__prev', el).addEventListener('click', () => go(-1));
      $('.lightbox__next', el).addEventListener('click', () => go(1));
      el.addEventListener('click', e => { if (e.target === el || e.target === stage) close(); });
      addEventListener('keydown', e => {
        if (!el.classList.contains('is-open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      });
      let sx = null;
      el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
      el.addEventListener('touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        sx = null;
      });
    };
    const placeholder = label => {
      const f = document.createElement('div');
      f.className = 'media is-missing lightbox__missing';
      f.dataset.label = label || 'Media coming soon';
      return f;
    };
    const ytId = src => (src.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/) || [])[1];
    const render = () => {
      const it = items[idx];
      stage.innerHTML = '';
      const type = it.type || (/\.(mp4|webm|mov)$/i.test(it.src) ? 'video' : ytId(it.src) ? 'youtube' : 'image');
      let node;
      if (type === 'youtube') {
        node = document.createElement('iframe');
        node.src = `https://www.youtube-nocookie.com/embed/${ytId(it.src)}?autoplay=1&rel=0`;
        node.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        node.allowFullscreen = true;
      } else if (type === 'video') {
        node = document.createElement('video');
        node.src = it.src; node.controls = true; node.autoplay = true; node.playsInline = true;
        node.addEventListener('error', () => node.replaceWith(placeholder('Video coming soon')));
      } else {
        node = document.createElement('img');
        node.src = it.src; node.alt = it.caption || '';
        node.addEventListener('error', () => node.replaceWith(placeholder('Photo coming soon')));
      }
      stage.appendChild(node);
      cap.textContent = it.caption || '';
      count.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
      el.classList.toggle('is-single', items.length < 2);
    };
    const go = d => { idx = (idx + d + items.length) % items.length; render(); };
    const open = (list, start = 0) => {
      if (!el) build();
      lastFocus = document.activeElement;
      items = list; idx = start;
      render();
      el.classList.add('is-open');
      document.body.classList.add('no-scroll');
      $('.lightbox__close', el).focus();
    };
    function close() {
      el.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      setTimeout(() => { stage.innerHTML = ''; }, 400);
      lastFocus && lastFocus.focus();
    }
    return { open };
  })();

  function initLightbox() {
    document.addEventListener('click', e => {
      const trigger = e.target.closest('[data-lightbox], [data-video]');
      if (!trigger) return;
      e.preventDefault();
      if (trigger.dataset.video !== undefined) {
        Lightbox.open([{ src: trigger.dataset.video, caption: trigger.dataset.caption, type: trigger.dataset.type }]);
        return;
      }
      const group = trigger.dataset.lightbox;
      const all = $$(`[data-lightbox="${group}"]`).filter(a => !a.classList.contains('is-hidden'));
      Lightbox.open(all.map(a => ({ src: a.getAttribute('href'), caption: a.dataset.caption, type: a.dataset.type })), all.indexOf(trigger));
    });
  }

  /* ---------- Gallery filter ---------- */
  function initFilters() {
    $$('[data-filters]').forEach(bar => {
      const gallery = $(bar.dataset.filters);
      const items = $$('[data-cat]', gallery);
      const btns = $$('.filters__btn', bar);
      const pill = document.createElement('span');
      pill.className = 'filters__pill';
      bar.prepend(pill);
      const movePill = btn => {
        pill.style.width = `${btn.offsetWidth}px`;
        pill.style.height = `${btn.offsetHeight}px`;
        pill.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
      };
      btns.forEach(btn => btn.addEventListener('click', () => {
        btns.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', b === btn); });
        movePill(btn);
        const f = btn.dataset.filter;
        items.forEach(it => it.classList.add('is-hiding'));
        setTimeout(() => {
          items.forEach(it => {
            const show = f === 'all' || it.dataset.cat.split(' ').includes(f);
            it.classList.toggle('is-hidden', !show);
          });
          requestAnimationFrame(() => requestAnimationFrame(() => items.forEach(it => it.classList.remove('is-hiding'))));
        }, 320);
      }));
      const active = $('.filters__btn.is-active', bar) || btns[0];
      requestAnimationFrame(() => movePill(active));
      addEventListener('resize', () => movePill($('.filters__btn.is-active', bar) || btns[0]));
    });
  }

  /* ---------- Testimonial slider ---------- */
  function initSliders() {
    $$('[data-slider]').forEach(slider => {
      const slides = $$('.slide', slider);
      const dotsWrap = $('.slider__dots', slider);
      if (slides.length < 2) return;
      const time = 7000;
      slider.style.setProperty('--slide-time', `${time}ms`);
      dotsWrap.innerHTML = slides.map((_, i) => `<button class="slider__dot" aria-label="Show story ${i + 1}"></button>`).join('');
      const dots = $$('.slider__dot', dotsWrap);
      let idx = 0, timer;
      const show = i => {
        idx = (i + slides.length) % slides.length;
        slides.forEach((s, n) => { s.classList.toggle('is-active', n === idx); s.setAttribute('aria-hidden', n !== idx); });
        dots.forEach((d, n) => {
          d.classList.remove('is-active');
          if (n === idx) { void d.offsetWidth; d.classList.add('is-active'); }
        });
        restart();
      };
      const restart = () => {
        clearTimeout(timer);
        if (!reduceMotion && !slider.classList.contains('is-paused')) timer = setTimeout(() => show(idx + 1), time);
      };
      dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
      $('.slider__btn--prev', slider).addEventListener('click', () => show(idx - 1));
      $('.slider__btn--next', slider).addEventListener('click', () => show(idx + 1));
      slider.addEventListener('mouseenter', () => { slider.classList.add('is-paused'); clearTimeout(timer); });
      slider.addEventListener('mouseleave', () => { slider.classList.remove('is-paused'); restart(); });
      let sx = null;
      slider.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener('touchend', e => {
        if (sx === null) return;
        const dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
        sx = null;
      });
      show(0);
    });
  }

  /* ---------- Accordion ---------- */
  function initAccordion() {
    $$('.acc__btn').forEach(btn => btn.addEventListener('click', () => {
      const acc = btn.closest('.acc');
      const open = !acc.classList.contains('is-open');
      acc.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open);
    }));
  }

  /* ---------- Clipboard ---------- */
  function initCopy() {
    $$('[data-copy]').forEach(btn => btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
      }
      btn.classList.add('is-copied');
      const label = $('span', btn);
      const prev = label ? label.textContent : '';
      if (label) label.textContent = 'Copied';
      toast(`Copied: ${text}`);
      setTimeout(() => { btn.classList.remove('is-copied'); if (label) label.textContent = prev; }, 2000);
    }));
  }

  /* ---------- Hearts burst ---------- */
  function burst(x, y, n = 24) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const h = document.createElement('span');
      h.className = 'confetti';
      h.textContent = ['♥', '❤', '✦'][i % 3];
      const ang = Math.random() * Math.PI * 2, dist = 120 + Math.random() * 200;
      h.style.setProperty('--x0', `${x}px`); h.style.setProperty('--y0', `${y}px`);
      h.style.setProperty('--x1', `${x + Math.cos(ang) * dist}px`);
      h.style.setProperty('--y1', `${y + Math.sin(ang) * dist - 80}px`);
      h.style.setProperty('--r', `${(Math.random() - .5) * 720}deg`);
      h.style.color = ['#e8643c', '#f4a83a', '#3fa37b'][i % 3];
      document.body.appendChild(h);
      setTimeout(() => h.remove(), 1700);
    }
  }

  /* ---------- Forms (AJAX to forms/submit.php) ---------- */
  function validateField(input) {
    const field = input.closest('.field');
    if (!field) return input.checkValidity();
    let err = $('.field__error', field);
    if (!err) { err = document.createElement('small'); err.className = 'field__error'; field.appendChild(err); }
    const ok = input.checkValidity();
    field.classList.toggle('is-invalid', !ok);
    err.textContent = ok ? '' : input.validity.valueMissing ? 'This field is required.' : input.validity.typeMismatch ? 'Please enter a valid ' + (input.type === 'email' ? 'email address.' : 'value.') : input.validationMessage;
    return ok;
  }

  function initForms() {
    $$('form[data-ajax]').forEach(form => {
      const ts = $('[name="_ts"]', form);
      if (ts) ts.value = Math.floor(Date.now() / 1000);
      const status = $('.form-status', form);
      $$('input, textarea, select', form).forEach(i => i.addEventListener('blur', () => { if (i.closest('.field')) validateField(i); }));

      form.addEventListener('submit', async e => {
        e.preventDefault();
        const fields = $$('input:not([type=hidden]), textarea, select', form).filter(i => !i.closest('.hp'));
        const valid = fields.map(validateField).every(Boolean);
        if (!valid) {
          status && (status.className = 'form-status is-error', status.textContent = 'Please check the highlighted fields.');
          const first = $('.is-invalid input, .is-invalid textarea, .is-invalid select', form) || fields.find(f => !f.checkValidity());
          first && first.focus();
          return;
        }
        const btn = $('[type="submit"]', form);
        btn && btn.classList.add('is-loading');
        status && (status.className = 'form-status', status.textContent = 'Sending…');
        try {
          const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          const data = await res.json().catch(() => ({ ok: false }));
          if (!res.ok || !data.ok) throw new Error(data.message || 'Request failed');
          status && (status.className = 'form-status is-ok', status.textContent = data.message || 'Thank you!');
          form.classList.add('is-sent');
          form.reset();
          const r = (btn || form).getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 18);
          if (form.classList.contains('newsletter')) toast('You’re subscribed — thank you!');
        } catch (err) {
          status && (status.className = 'form-status is-error',
            status.innerHTML = `Sorry, we couldn’t send that right now. Please email <a href="mailto:${CFG.email}"><u>${CFG.email}</u></a>.`);
        } finally {
          btn && btn.classList.remove('is-loading');
        }
      });
    });
  }

  /* ---------- Donation widget ---------- */
  function initDonate() {
    const w = $('[data-donate]');
    if (!w) return;
    const D = CFG.donate || {};
    const min = D.minimum || 1000;
    const state = { freq: 'once', amount: 10000 };
    const seg = $('.segmented', w);
    const amountBtns = $$('.amount-btn', w);
    const custom = $('#donate-custom', w);
    const impact = $('.impact-line p', w);
    const total = $$('[data-donate-total]', w);
    const impacts = [
      [225000, 'Provides full care for three elders.'],
      [150000, 'Provides full care for two elders.'],
      [75000, 'Provides full care for an elder.'],
      [45000, 'Covers clothing, toiletries and bedding for an elder.'],
      [20000, 'Pays for a health check and medication.'],
      [10000, 'Puts a food pack in an elder’s hands.'],
      [0, 'Every naira brings comfort to someone who has been forgotten.'],
    ];
    const update = () => {
      const msg = impacts.find(([n]) => state.amount >= n)[1];
      if (impact && impact.textContent !== msg) {
        impact.classList.add('is-swapping');
        setTimeout(() => { impact.textContent = msg; impact.classList.remove('is-swapping'); }, 200);
      }
      total.forEach(t => { t.textContent = naira(state.amount) + (state.freq === 'monthly' ? ' / month' : ''); });
    };
    const setAmount = (n, fromCustom) => {
      state.amount = n || 0;
      amountBtns.forEach(b => b.classList.toggle('is-active', !fromCustom && +b.dataset.amount === state.amount));
      if (!fromCustom && custom) custom.value = '';
      update();
    };
    $$('button', seg).forEach(b => b.addEventListener('click', () => {
      state.freq = b.dataset.freq;
      seg.dataset.freq = state.freq;
      $$('button', seg).forEach(x => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', x === b); });
      update();
    }));
    amountBtns.forEach(b => b.addEventListener('click', () => setAmount(+b.dataset.amount)));
    custom && custom.addEventListener('input', () => {
      custom.value = custom.value.replace(/[^\d]/g, '');
      setAmount(+custom.value, true);
    });
    const qs = +new URLSearchParams(location.search).get('amount');
    if (qs > 0) {
      const match = amountBtns.find(b => +b.dataset.amount === qs);
      match ? setAmount(qs) : (custom.value = qs, setAmount(qs, true));
    } else setAmount(state.amount);

    const thank = ref => {
      w.classList.add('is-thanked');
      const refEl = $('[data-donate-ref]', w);
      if (refEl && ref) refEl.textContent = `Reference: ${ref}`;
      const r = w.getBoundingClientRect();
      burst(r.left + r.width / 2, Math.max(r.top, 0) + 160, 36);
    };

    const loadPaystack = () => new Promise((res, rej) => {
      if (window.PaystackPop) return res();
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v1/inline.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });

    const form = $('form', w);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const status = $('.form-status', form);
      if (state.amount < min) {
        status.className = 'form-status is-error';
        status.textContent = `Please choose an amount of at least ${naira(min)}.`;
        return;
      }
      const fields = $$('input[required]', form);
      if (!fields.map(validateField).every(Boolean)) return;
      const email = $('[name="email"]', form).value.trim();
      const name = $('[name="name"]', form).value.trim();
      const btn = $('[type="submit"]', form);

      if (state.freq === 'monthly' && D.paystackMonthlyLink) { window.open(D.paystackMonthlyLink, '_blank', 'noopener'); return; }
      if (D.paystackPublicKey) {
        btn.classList.add('is-loading');
        try {
          await loadPaystack();
          const handler = window.PaystackPop.setup({
            key: D.paystackPublicKey,
            email,
            amount: Math.round(state.amount * 100),
            currency: D.currency || 'NGN',
            metadata: { custom_fields: [
              { display_name: 'Donor name', variable_name: 'donor_name', value: name },
              { display_name: 'Frequency', variable_name: 'frequency', value: state.freq },
            ] },
            callback: resp => thank(resp.reference),
            onClose: () => toast('Payment window closed — no charge was made.'),
          });
          handler.openIframe();
        } catch (err) {
          status.className = 'form-status is-error';
          status.textContent = 'We couldn’t load the secure payment window. Please try again or use bank transfer.';
        } finally { btn.classList.remove('is-loading'); }
        return;
      }
      if (D.paystackPaymentLink) { window.open(D.paystackPaymentLink, '_blank', 'noopener'); return; }
      status.className = 'form-status is-error';
      status.textContent = 'Online card payments are being set up. Please use the bank transfer details for now.';
      const bank = $('#bank-transfer');
      bank && bank.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---------- Donut chart ---------- */
  function initDonut() {
    $$('[data-donut]').forEach(wrap => {
      const svg = $('svg', wrap);
      const legend = $(wrap.dataset.donut);
      const items = $$('li', legend);
      const r = 80, C = 2 * Math.PI * r;
      let acc = 0;
      const circles = items.map(li => {
        const v = parseFloat(li.dataset.value);
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', 100); c.setAttribute('cy', 100); c.setAttribute('r', r);
        c.setAttribute('stroke', li.dataset.color);
        const len = (v / 100) * C;
        c.style.strokeDasharray = `${Math.max(len - 3, 0)} ${C}`;
        c.style.strokeDashoffset = C;
        c.dataset.offset = -acc;
        acc += len;
        $('i', li).style.background = li.dataset.color;
        svg.appendChild(c);
        return c;
      });
      const center = $('.donut__center strong', wrap), centerLbl = $('.donut__center span', wrap);
      const defaultLbl = centerLbl.textContent, defaultVal = center.textContent;
      items.forEach((li, i) => {
        li.addEventListener('mouseenter', () => {
          circles.forEach((c, n) => { c.classList.toggle('is-dim', n !== i); c.classList.toggle('is-focus', n === i); });
          center.textContent = li.dataset.value + '%';
          centerLbl.textContent = $('span', li).textContent;
        });
        li.addEventListener('mouseleave', () => {
          circles.forEach(c => c.classList.remove('is-dim', 'is-focus'));
          center.textContent = defaultVal; centerLbl.textContent = defaultLbl;
        });
      });
      const io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        circles.forEach((c, i) => setTimeout(() => { c.style.strokeDashoffset = c.dataset.offset; }, i * 150));
        io.disconnect();
      }, { threshold: .4 });
      io.observe(wrap);
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
    prepareReveal();
    initMedia();
    initMarquee();
    initHeader();
    initTransitions();
    initLightbox();
    initFilters();
    initSliders();
    initAccordion();
    initCopy();
    initForms();
    initDonate();
    initDonut();
    initCounters();
    initScrollFx();
    initPointerFx();
    initCursor();
    initLoader().then(() => {
      initReveal();
      // Layout shifts after scripts run (pinned gallery, split text), so re-apply #anchor links
      const target = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
      if (!target) return;
      const jump = () => target.scrollIntoView({ behavior: 'instant', block: 'start' });
      setTimeout(jump, 60);
      if (document.readyState === 'complete') setTimeout(jump, 120);
      else addEventListener('load', () => setTimeout(jump, 60), { once: true });
    });
  });
})();
