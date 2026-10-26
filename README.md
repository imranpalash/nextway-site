# Nextway Education Consultancy — website

Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.
The only server-side file is `contact.php` (sends the contact form to info@nextwayedu.com).

## Structure

```
index.html                  Home
study-abroad/               Service pages (one folder each, each with index.html)
university-admission/
visa-assistance/
ielts/
spoken-english/
ticket-and-travel/
team/  contact/  privacy/  legal-notice/
404.html  contact.php  .htaccess  robots.txt  sitemap.xml
assets/css/style.css        All styling (design tokens at the top)
assets/js/main.js           Menu, open/closed badge, animations, form
assets/img/ team/ flags/ fonts/
.cpanel.yml                 Tells cPanel how to copy the site into public_html
```

## Things you will edit most often

| Change | Where |
|---|---|
| Phone, address, hours | Search all `*.html` for `1614 109215`, `Choto Kalibari`, `10 am` |
| Open/closed badge hours | `status()` in `assets/js/main.js` |
| Colours | `:root` variables at the top of `assets/css/style.css` |
| Testimonials | `index.html`, section "Student stories" |
| Countries | `index.html` (flag chips). Flag SVGs live in `assets/flags/` |
| Real testimonials / photos | Replace text, drop images in `assets/img/` |

## Deploying to Namecheap (cPanel Git Version Control)

1. **Back up first.** In cPanel File Manager, zip the current `public_html` and download it.
2. **Push this folder to GitHub** (a new repository; the files in this folder are the repository root).
3. In cPanel open **Git™ Version Control → Create**.
   - Clone URL: your GitHub repository URL (a public repo works with HTTPS; for a private repo add the cPanel SSH key as a GitHub *deploy key* and use the `git@github.com:...` URL).
   - Repository path: `/home/<cpanel-user>/repositories/nextway-site` (anything outside `public_html`).
   - Click **Create**.
4. Click **Manage → Deploy HEAD Commit**. cPanel runs `.cpanel.yml`, which copies the site into `public_html`.
5. Open https://nextwayedu.com and check every page, then send a test message through the contact form.
6. After you are happy, remove the old SiteJet leftovers from `public_html`: `api.php`, `webcard/`, `css/custom.*.css`, `js/custom.*.js`, `bundles/`, `g/`, `images/`, `blog-single-page-layout/`, `jobs-1-item/`, `team-item/`, `index.html.bak`. Keep `.well-known/`.

### Updating the site later
Edit files, commit, push to GitHub, then in cPanel: **Manage → Update from Remote**, then **Deploy HEAD Commit**.

### No Git on your plan?
Zip the contents of this folder (not the folder itself), upload the zip to `public_html` with File Manager and click **Extract**.

## Contact form notes
- `contact.php` uses PHP `mail()`. Messages are sent *from* `no-reply@nextwayedu.com` and *to* `info@nextwayedu.com` (change both at the top of the file).
- Spam protection: hidden honeypot field + one message per IP per minute. There is no CAPTCHA.
- If messages do not arrive, check the spam folder and that the domain's SPF record includes your host.

## Local preview
```
python -m http.server 8080
```
then open http://localhost:8080 (the form does not send locally because PHP is not running).
