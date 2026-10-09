# Going live on Namecheap: step by step

You upload **one zip file**: `deploy/elastrong-website.zip` (a packed copy of `public_html/`).

## 0. Before you start
- Log in at **namecheap.com**, then **Hosting List**, then **Go to cPanel** next to your hosting plan.
- Check the domain points to the hosting: **Domain List**, then **Manage** next to *elastrongcaresfoundation.org*, then **Nameservers**. It should say **Namecheap Web Hosting DNS**. If you change it, allow up to 24 to 48 hours (usually under an hour).

## 1. Turn on HTTPS (free SSL)
cPanel, then **SSL/TLS Status**, then tick the domain (and `www.`), then **Run AutoSSL**. Wait until it shows a green padlock.
The site forces `https://`, so this must be done first.

## 2. Create the email addresses the forms use
cPanel, then **Email Accounts**, then **+ Create**:
- `info@elastrongcaresfoundation.org`: receives form messages (you read it via **Check Email** / webmail)
- `no-reply@elastrongcaresfoundation.org`: the "From" address the website sends with

## 3. Upload the website
1. cPanel, then **File Manager**, then open **public_html**.
2. Top-right **Settings**, then tick **Show Hidden Files (dotfiles)**, then **Save**.
3. If public_html contains Namecheap's default files (e.g. `default.html`, `cgi-bin` can stay), delete `default.html` / `index.html` placeholders.
4. **Upload**, then choose `deploy/elastrong-website.zip`, then wait for 100%, then go back.
5. Right-click the zip, then **Extract**, then extract to `/public_html`, then **Extract Files**.
6. Delete the zip from the server afterwards.
7. Check that `public_html` now shows `index.html`, `assets/`, `forms/`, and `.htaccess`.

## 4. Check it works
- Open **https://elastrongcaresfoundation.org**. You should see the animated site.
- Try `https://elastrongcaresfoundation.org/about`. Clean URLs should work.
- Try a wrong address like `/test`. Your custom 404 page should appear.
- Send a test message from the **Contact** page, then check the `info@` inbox (and spam folder).
- On your phone, open the site and tap the menu, the gallery and the Donate page.

## 5. Automatic deploys from GitHub (recommended)
Once set up, every change pushed to GitHub goes live by itself in about a minute, with no zip and no File Manager.
The workflow lives in `.github/workflows/deploy.yml`. It rebuilds the pages and uploads **only changed files** over encrypted FTP (FTPS).

**A. Create a dedicated FTP account (cPanel)**
1. cPanel, then **FTP Accounts**.
2. Log in: `deploy`. Domain: `elastrongcaresfoundation.org`. Click **Generate** for a strong password and copy it somewhere safe.
3. **Directory:** change it to exactly `public_html` (delete anything cPanel adds after it).
4. **Quota:** Unlimited, then **Create FTP Account**.
5. Scroll down to the new account, click **Configure FTP Client** and note the **FTP Server** (e.g. `ftp.elastrongcaresfoundation.org`) and **FTP Username** (e.g. `deploy@elastrongcaresfoundation.org`).

**B. Give GitHub the details (stored encrypted, never visible again)**
1. Open github.com/mealand/elastrong-website, then **Settings**, then **Secrets and variables**, then **Actions**.
2. **New repository secret** three times:
   | Name | Value |
   |---|---|
   | `FTP_SERVER` | the FTP Server from step A5 |
   | `FTP_USERNAME` | the full FTP Username from step A5 |
   | `FTP_PASSWORD` | the password from step A2 |

**C. First deploy**
1. Repository, then the **Actions** tab, then **Deploy website** (left), then **Run workflow**, then **Run workflow**.
2. Wait for the green tick (the first run uploads everything; later runs only send changes).
3. Open the site and hard-refresh (Ctrl+F5).

**If it fails:** click the red run to read the log.
- *Login/530 errors*: re-check the three secrets (username must include `@elastrongcaresfoundation.org`).
- *TLS/certificate errors*: in `deploy.yml` change `protocol: ftps` to `protocol: ftp` (less secure; only if FTPS is unavailable).
- *Files landed in the wrong folder*: if your FTP account opens in your home folder rather than `public_html`, add a repository **variable** `FTP_SERVER_DIR` = `public_html/`.

## 6. Updating the site later
1. Edit `site.config.json` or files in `src/`.
2. Run `node build.mjs` (preview with `node build.mjs --serve`).
3. Commit & push to GitHub; the site deploys automatically (or, without auto-deploy, re-create the zip and upload it).
4. Check the **Actions** tab for the green tick.

## Launch checklist (when real details are in)
- [ ] Real phone, WhatsApp, address, CAC number, bank details in `site.config.json`
- [ ] Real impact numbers, testimonials, team names, outreach cards
- [ ] Paystack public key added (or bank transfer only)
- [ ] `"indexable": true` in `site.config.json`, so Google is allowed to list the site
- [ ] Submit `https://elastrongcaresfoundation.org/sitemap.xml` in Google Search Console

## Troubleshooting
| Problem | Fix |
|---|---|
| "Not secure" warning or redirect loop | AutoSSL hasn't finished; re-run it, wait, clear browser cache |
| Pages show but look unstyled | Files were extracted into a subfolder; move everything up into `public_html` |
| `/about` gives 404 but `/about.html` works | `.htaccess` missing; enable *Show Hidden Files* and re-extract |
| Contact form says it couldn't send | Make sure the `no-reply@` mailbox exists; messages are also saved in `public_html/forms/storage/*.csv` |
| Old version still showing | Hard refresh (Ctrl+F5); cPanel, then **LiteSpeed Cache** (if present), then **Flush All** |
