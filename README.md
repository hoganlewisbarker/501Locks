# 501 LOCKS — Deployment Guide

Your Anthropic API key is **never** exposed to the browser. All AI calls go through the `/api/analyze` server route.

---

## Step 1 — Push to GitHub

1. Go to [github.com](https://github.com) → click **New repository**
2. Name it `501locks`, set it **Public** or **Private** (either works)
3. **Don't** initialize with README (you already have files)
4. Click **Create repository**

Then in your terminal, run the commands GitHub shows you. They'll look like:

```bash
cd /path/to/501locks
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/501locks.git
git push -u origin main
```

---

## Step 2 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Sign up with GitHub** (free)
2. Click **Add New → Project**
3. Find your `501locks` repo and click **Import**
4. Vercel auto-detects Next.js — just click **Deploy**
5. It'll fail the first time because the API key isn't set yet — that's OK

---

## Step 3 — Add your API Key to Vercel

1. In your Vercel project dashboard → **Settings → Environment Variables**
2. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** `sk-ant-...` (your actual Anthropic API key)
   - **Environments:** Production, Preview, Development ✓ all three
3. Click **Save**
4. Go to **Deployments** → click the three dots on the latest deploy → **Redeploy**

Your site is now live at `your-project.vercel.app` 🎉

---

## Step 4 (Optional) — Custom Domain

1. Buy a domain at [namecheap.com](https://namecheap.com) or [cloudflare.com](https://cloudflare.com/products/registrar/) (~$10-15/yr)
2. In Vercel: **Settings → Domains → Add**
3. Type your domain name → Vercel gives you DNS records to add
4. Add those records at your domain registrar
5. Takes ~10 minutes to go live

---

## Local Development

```bash
# Install dependencies
npm install

# Create your local env file
cp .env.example .env.local
# Edit .env.local and add your real API key

# Start the dev server
npm run dev
# Open http://localhost:3000
```

---

## Rate Limiting

The `/api/analyze` route limits each IP to **20 AI analyses per hour** to control costs. To adjust this, edit `pages/api/analyze.js` and change the `20` on this line:

```js
if (store[ip].count > 20) {
```

For a high-traffic site, swap the in-memory store for [Upstash Redis](https://upstash.com) (free tier available).

---

## Cost Estimate

Each "Deep Analysis" call uses ~1,000 tokens. At Claude Sonnet pricing:
- 1,000 analyses = ~$3
- With 20/hr rate limit per IP, you're well protected

---

## File Structure

```
501locks/
├── pages/
│   ├── index.js          # Redirects to app.html
│   ├── _app.js           # Next.js app wrapper
│   └── api/
│       └── analyze.js    # 🔐 API proxy (key stays secret here)
├── public/
│   └── app.html          # Your full 501 LOCKS app
├── .env.example          # Template — copy to .env.local
├── .gitignore            # Keeps secrets out of git
├── next.config.js
└── package.json
```
