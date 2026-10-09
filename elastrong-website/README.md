# Elastrong Cares Foundation: website

Static, dependency-free website for **elastrongcaresfoundation.org**, built for Namecheap shared hosting (cPanel, Apache/LiteSpeed, PHP).

## Folder structure

```
elastrong-website/
├── public_html/              ← UPLOAD THE CONTENTS OF THIS FOLDER to cPanel › public_html
│   ├── index.html, about.html, programs.html, outreaches.html,
│   │   get-involved.html, donate.html, contact.html, privacy.html, 404.html   (generated)
│   ├── assets/
│   │   ├── css/main.css      ← all styles & animations (design tokens at the top)
│   │   ├── js/main.js        ← all interactions (vanilla JS, no libraries)
│   │   ├── js/config.js      ← generated from site.config.json
│   │   ├── images/<section>/ ← photos go here (see MEDIA-CHECKLIST.md)
│   │   └── videos/           ← .mp4 videos go here
│   ├── forms/
│   │   ├── submit.php        ← handles contact / volunteer / partner / newsletter forms
│   │   ├── config.php        ← recipient email etc. (blocked from public access)
│   │   └── storage/          ← CSV backup of every submission (blocked from public access)
│   ├── .htaccess             ← HTTPS, clean URLs, caching, compression, security headers
│   ├── robots.txt, sitemap.xml, site.webmanifest, favicon.svg
├── src/                      ← page sources (edit these, not the generated HTML)
│   ├── pages/*.html
│   └── partials/             ← shared head, header, footer, icons
├── site.config.json          ← ALL organisation details: phone, email, bank, socials, stats…
├── build.mjs                 ← builds src → public_html, writes sitemap & media checklist
├── tools/enhance-media.mjs   ← colour-grades & optimises raw photos for the web
└── MEDIA-CHECKLIST.md        ← every photo/video slot and whether it's filled
```

## Everyday workflow

Requires [Node.js](https://nodejs.org) 18+ on your computer (not on the server).

```bash
node build.mjs            # rebuild pages after editing src/ or site.config.json
node build.mjs --serve    # rebuild + preview at http://localhost:8080
```

### Adding photos & videos
Every image slot shows an animated placeholder until a file exists at its path. Open **MEDIA-CHECKLIST.md** for the full list.

To enhance and optimise raw photos (auto-rotate, strip GPS data, colour grade, resize, compress):
```bash
npm install
node tools/enhance-media.mjs raw/outreach public_html/assets/images/outreach --prefix outreach-
```
Videos: MP4 (H.264), ideally under 10 MB for background loops (10–20 s, muted) and under 50 MB for films. YouTube links also work in any `data-video="…"` attribute.

## Donations (Paystack)
1. Create a free account at paystack.com and complete business verification.
2. Put your **public** key (`pk_live_…`) in `site.config.json › donate.paystackPublicKey`. Never put the secret key anywhere on the site.
3. Optional: create a Paystack *Payment Page* with recurring billing and set `paystackMonthlyLink` for monthly gifts.
4. Fill in the bank account details, then rebuild.

Until a key is set, the Donate button points visitors to the bank transfer details.

## Deploying to Namecheap
1. cPanel › **SSL/TLS Status** → run AutoSSL so HTTPS works.
2. cPanel › **Email Accounts** → create `info@` and `no-reply@` mailboxes (used by the forms).
3. Run `node build.mjs`, then upload **the contents** of `public_html/` into the server's `public_html` folder (File Manager › Upload a .zip › Extract, or FTP).
4. Make sure hidden files are uploaded too (`.htaccess`, `forms/storage/.htaccess`).
5. Visit the site, submit a test contact form and check the inbox.
6. Submit `https://elastrongcaresfoundation.org/sitemap.xml` in Google Search Console.

## Content to replace before launch
Placeholder content is in `site.config.json` (phone, bank, reg. number, socials, impact stats) and in:
- `src/pages/about.html`: team names and roles
- `src/pages/index.html`: testimonial quotes and names (use real, consented quotes)
- `src/pages/outreaches.html`: recent outreach cards (titles, dates, places)
- `src/pages/donate.html`: "where your gift goes" percentages, which must reflect your real budget
