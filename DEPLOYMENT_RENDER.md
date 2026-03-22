# Deploy Python Mastery to Render

## Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add YouTube links, assessments, careers, progress tracker"
   git push origin main
   ```

2. **Create Render account** at [render.com](https://render.com)

3. **New Static Site**
   - Dashboard → New → Static Site
   - Connect your GitHub repository
   - Build Command: `npm run build`
   - Publish Directory: `public`

4. **Deploy**
   - Click Create Static Site
   - Render builds and deploys. Your site will be at `https://your-service-name.onrender.com`

## Using render.yaml (Blueprint)

If `render.yaml` is in your repo root, Render can auto-detect settings:
- `buildCommand`: npm run build
- `staticPublishPath`: public

## Custom Domain

In Render dashboard: Settings → Custom Domains → Add your domain.
