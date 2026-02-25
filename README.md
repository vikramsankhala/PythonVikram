# Python Mastery — Training Course

A complete 16-week, 160-block training program for Data Science, Machine Learning & Scientific Computing. Built from the curriculum in `complete_python_training_course.docx`.

## Deploy on Netlify via GitHub

### 1. Push to GitHub

```bash
cd python-training-course
git init
git add .
git commit -m "Initial commit: Python Mastery training course"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/python-training-course.git
git push -u origin main
```

### 2. Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click **Add new site** → **Import an existing project**
3. Connect to GitHub and select `python-training-course`
4. Build settings (auto-detected):
   - **Build command:** `npm run build`
   - **Publish directory:** `public`
5. Click **Deploy site**

Your course will be live at `https://your-site-name.netlify.app`

## Local Development

```bash
npm install   # Optional: no deps required
npm run build
npx serve public
```

Then open http://localhost:3000

## Structure

- **content/** — Course data (JSON)
  - `course-structure.json` — Weeks and metadata
  - `blocks-metadata.json` — All 160 blocks (extracted from docx)
  - `blocks/` — Full content for blocks 1–10 (problems, code, case studies)
- **scripts/** — Build and extraction scripts
- **public/** — Generated static site (after `npm run build`)

## Regenerating Block Metadata

If you update `docx_extracted.txt` (from the original .docx):

```bash
python scripts/extract_blocks.py
npm run build
```

## Adding Full Content for More Blocks

Create `content/blocks/block-XXX.json` (e.g. `block-011.json`) with:

```json
{
  "id": 11,
  "week": 2,
  "day": "Monday",
  "title": "...",
  "objective": "...",
  "concepts": [...],
  "exercise": { "description": "...", "solution": "```python\n...\n```" },
  "homework": "...",
  "problems": [{ "q": "...", "hint": "..." }],
  "code": { "example1": { "title": "...", "code": "..." } },
  "application": "...",
  "caseStudy": "...",
  "project": "..."
}
```

Then run `npm run build`.
