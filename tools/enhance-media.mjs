/**
 * Media enhancer: turns raw phone/camera photos into web-ready, colour-graded images.
 *
 *   npm install            (once, installs "sharp")
 *   node tools/enhance-media.mjs <input-folder> <output-folder> [--width 2000] [--prefix outreach-]
 *
 * Example:
 *   node tools/enhance-media.mjs raw-media/outreach public_html/assets/images/outreach --prefix outreach-
 *   → outreach-01.jpg, outreach-02.jpg … (matching the slot names in MEDIA-CHECKLIST.md)
 *
 * What it does to each photo:
 *   - auto-rotates using EXIF, strips location/camera metadata (privacy)
 *   - resizes to a sensible max width (default 2000px)
 *   - gentle tone curve: normalise levels, a little extra warmth, saturation and clarity
 *   - sharpens lightly after resizing
 *   - saves as progressive MozJPEG (~150–400 KB) plus a WebP copy
 */
import fs from 'node:fs';
import path from 'node:path';

let sharp;
try { sharp = (await import('sharp')).default; }
catch { console.error('Missing dependency. Run:  npm install'); process.exit(1); }

const [, , inDir, outDir, ...rest] = process.argv;
if (!inDir || !outDir) {
  console.log('Usage: node tools/enhance-media.mjs <input-folder> <output-folder> [--width 2000] [--prefix name-]');
  process.exit(1);
}
const opt = (name, def) => { const i = rest.indexOf(`--${name}`); return i >= 0 ? rest[i + 1] : def; };
const width = Number(opt('width', 2000));
const prefix = opt('prefix', '');

fs.mkdirSync(outDir, { recursive: true });
const files = fs.readdirSync(inDir).filter(f => /\.(jpe?g|png|webp|heic|tiff?)$/i.test(f)).sort();

let n = 0;
for (const file of files) {
  n++;
  const name = prefix ? `${prefix}${String(n).padStart(2, '0')}` : path.parse(file).name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const base = sharp(fs.readFileSync(path.join(inDir, file)), { failOn: 'none' })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .normalise({ lower: 1, upper: 99 })
    .modulate({ saturation: 1.1, brightness: 1.02 })
    .linear(1.04, -4)              // a touch of contrast
    .recomb([[1.04, 0, 0], [0, 1.0, 0], [0, 0, 0.95]]) // subtle warm grade, on brand
    .sharpen({ sigma: 0.8 });

  // write via fs (works inside sandboxed / virtualised folders where libvips can't)
  fs.writeFileSync(path.join(outDir, `${name}.jpg`), await base.clone().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer());
  fs.writeFileSync(path.join(outDir, `${name}.webp`), await base.clone().webp({ quality: 78 }).toBuffer());
  console.log(`  ✓ ${file} → ${name}.jpg`);
}
console.log(`\nEnhanced ${n} image(s) into ${outDir}. Run "node build.mjs" to refresh MEDIA-CHECKLIST.md.`);
