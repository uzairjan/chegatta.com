# chegatta.com

Marketing website for **Chegatta**, the smart employee attendance tracking and workforce insights platform. Served at https://chegatta.com via GitHub Pages.

Static vanilla HTML/CSS/JS — no frameworks, no build step.

## Deploy

1. Repo Settings → Pages → Source: **GitHub Actions**.
2. Pages → Custom domain: `chegatta.com` → Save (complete DNS verification).
3. DNS at Namecheap (chegatta.com → Advanced DNS):
   - 4 × `A` records, Host `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - 1 × `CNAME`, Host `www` → `uzairjan.github.io`
   - Remove the default parking records.
4. Push to `main` — the `pages.yml` workflow publishes the repo root to Pages.

HTTPS is automatic. The committed `CNAME` file binds the site to chegatta.com.
