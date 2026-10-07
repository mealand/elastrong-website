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

## 5. Updating the site later
1. Edit `site.config.json` or files in `src/`.
2. Run `node build.mjs` (preview with `node build.mjs --serve`).
3. Re-create the zip (ask Claude, or zip the *contents* of `public_html/`), upload and extract over the old files.
4. Commit & push to GitHub so the history is backed up.

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
