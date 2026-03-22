# Deploy Python Mastery to Render

## Setup (Web Service)

1. **Push to GitHub**
2. **Create Render account** at [render.com](https://render.com)
3. **New → Web Service** (not Static Site)
4. Connect your GitHub repository
5. Build Command: `npm run render-build` (installs deps + builds; or use `npm install && npm run build`)
6. Start Command: `npm start`

## AI Features (Anthropic Claude)

Add `ANTHROPIC_API_KEY` in Render:
- Dashboard → Your Service → Environment
- Add variable: `ANTHROPIC_API_KEY` = your key from [console.anthropic.com](https://console.anthropic.com)

Without the key, AI features return a friendly error.

## Custom Domain

Settings → Custom Domains → Add your domain.
