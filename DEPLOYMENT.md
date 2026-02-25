# Deploy Python Mastery to Netlify via GitHub

## Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click **New repository**
3. Name it `python-training-course` (or any name)
4. Choose **Public**, do NOT initialize with README (we already have files)
5. Click **Create repository**

## Step 2: Push Your Code

From the `python-training-course` folder:

```powershell
cd "c:\Users\I762844\Documents\Python Training\python-training-course"

git init
git add .
git commit -m "Python Mastery - 16-week training course"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/python-training-course.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 3: Deploy on Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Sign in with GitHub
3. Click **Add new site** → **Import an existing project**
4. Choose **GitHub** and authorize if needed
5. Select your `python-training-course` repository
6. Netlify will auto-detect:
   - **Build command:** `npm run build`
   - **Publish directory:** `public`
7. Click **Deploy site**

Your course will be live in ~1–2 minutes at a URL like:
`https://random-name-12345.netlify.app`

## Step 4: Custom Domain (Optional)

In Netlify: **Site settings** → **Domain management** → **Add custom domain**

## Troubleshooting

- **Build fails:** Ensure `content/blocks-metadata.json` exists (run `python scripts/extract_blocks.py` first)
- **Styles not loading:** Check that `public/styles.css` exists after build
- **404 on block pages:** Verify `public/block/` contains 1.html through 160.html
