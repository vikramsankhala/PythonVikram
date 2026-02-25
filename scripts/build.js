const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const CONTENT = path.join(BASE, 'content');
const PUBLIC = path.join(BASE, 'public');

// Ensure public dir exists
if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });
if (!fs.existsSync(path.join(PUBLIC, 'block'))) fs.mkdirSync(path.join(PUBLIC, 'block'), { recursive: true });
if (!fs.existsSync(path.join(PUBLIC, 'week'))) fs.mkdirSync(path.join(PUBLIC, 'week'), { recursive: true });

// Load data
const course = JSON.parse(fs.readFileSync(path.join(CONTENT, 'course-structure.json'), 'utf8'));
const blocksMeta = JSON.parse(fs.readFileSync(path.join(CONTENT, 'blocks-metadata.json'), 'utf8'));

// Build blocks map: merge full content (blocks 1-10) with metadata
const blocks = {};
blocksMeta.forEach(b => {
  blocks[b.id] = { ...b };
  const fullPath = path.join(CONTENT, 'blocks', `block-${String(b.id).padStart(3, '0')}.json`);
  if (fs.existsSync(fullPath)) {
    const full = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    Object.assign(blocks[b.id], full);
  }
});

const escape = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nl2br = (s) => String(s || '').replace(/\n/g, '<br>');

function renderBlock(block) {
  const prev = block.id > 1 ? block.id - 1 : null;
  const next = block.id < 160 ? block.id + 1 : null;
  const week = course.weeks.find(w => w.id === block.week) || {};

  let problemsHtml = '';
  if (block.problems && block.problems.length) {
    problemsHtml = block.problems.map((p, i) => `
      <div class="problem">
        <strong>Problem ${i + 1}:</strong> ${escape(p.q)}
        ${p.hint ? `<p class="hint"><em>Hint:</em> ${escape(p.hint)}</p>` : ''}
      </div>`).join('');
  }

  let codeHtml = '';
  if (block.code && typeof block.code === 'object') {
    const entries = Object.entries(block.code);
    codeHtml = entries.map(([k, v]) => {
      const code = typeof v === 'object' ? v.code : v;
      const title = typeof v === 'object' && v.title ? v.title : k;
      return `
      <div class="code-block">
        <h4>${escape(title)}</h4>
        <pre><code>${escape(code)}</code></pre>
      </div>`;
    }).join('');
  }

  let exerciseHtml = '';
  if (block.exercise && typeof block.exercise === 'object') {
    exerciseHtml = `<p>${escape(block.exercise.description)}</p>`;
    if (block.exercise.solution) {
      const sol = block.exercise.solution.replace(/^```\w*\n?|```$/g, '').trim();
      exerciseHtml += `<details><summary>Solution</summary><pre><code>${escape(sol)}</code></pre></details>`;
    }
  } else {
    exerciseHtml = `<p>${escape(block.exercise)}</p>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Block ${block.id}: ${escape(block.title)} | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">← Course</a>
    <a href="/week/${block.week}.html">Week ${block.week}</a>
    ${prev ? `<a href="/block/${prev}.html">← Block ${prev}</a>` : ''}
    ${next ? `<a href="/block/${next}.html">Block ${next} →</a>` : ''}
  </nav>
  <main class="container">
    <header class="block-header">
      <span class="badge">Week ${block.week} • ${block.day}</span>
      <h1>Block ${block.id}: ${escape(block.title)}</h1>
      <p class="objective">${escape(block.objective)}</p>
    </header>

    <section>
      <h2>Concepts</h2>
      <ul>
        ${(block.concepts || []).map(c => `<li>${escape(c)}</li>`).join('')}
      </ul>
    </section>

    <section>
      <h2>Code Examples</h2>
      ${codeHtml || '<p>See exercise below.</p>'}
    </section>

    <section>
      <h2>Exercise</h2>
      ${exerciseHtml}
    </section>

    ${problemsHtml ? `<section><h2>Practice Problems</h2>${problemsHtml}</section>` : ''}

    ${block.application ? `<section><h2>Application</h2><p>${escape(block.application)}</p></section>` : ''}
    ${block.caseStudy ? `<section><h2>Case Study</h2><p>${escape(block.caseStudy)}</p></section>` : ''}
    ${block.visualization ? `<section><h2>Visualization</h2><p>${escape(block.visualization)}</p></section>` : ''}
    ${block.project ? `<section><h2>Project</h2><p>${escape(block.project)}</p></section>` : ''}

    <section>
      <h2>Homework</h2>
      <p>${escape(block.homework)}</p>
    </section>

    <nav class="block-nav">
      ${prev ? `<a href="/block/${prev}.html">← Previous</a>` : ''}
      ${next ? `<a href="/block/${next}.html">Next →</a>` : ''}
    </nav>
  </main>
</body>
</html>`;
}

function renderWeek(week) {
  const weekBlocks = blocksMeta.filter(b => b.week === week.id);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Week ${week.id}: ${escape(week.title)} | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">← Course</a>
  </nav>
  <main class="container">
    <h1>Week ${week.id}: ${escape(week.title)}</h1>
    <p class="theme">${escape(week.theme)}</p>
    <div class="block-list">
      ${weekBlocks.map(b => `
        <a href="/block/${b.id}.html" class="block-card">
          <span class="block-num">Block ${b.id}</span>
          <span class="block-day">${b.day}</span>
          <h3>${escape(b.title)}</h3>
        </a>`).join('')}
    </div>
  </main>
</body>
</html>`;
}

function renderIndex() {
  const phases = [
    { name: 'Foundations', weeks: '1–4', topics: 'Python, NumPy, Pandas, Visualization' },
    { name: 'Working with Data & Web', weeks: '5–8', topics: 'File I/O, APIs, Web Scraping, Flask, FastAPI, ML' },
    { name: 'Science, NLP & Vision', weeks: '9–12', topics: 'SciPy, SymPy, Stats, NLP, Computer Vision' },
    { name: 'Engineering & Automation', weeks: '13–14', topics: 'Databases, ETL, Scripting, Testing' },
    { name: 'Capstone Project', weeks: '15–16', topics: 'Design, implement, package, present' }
  ];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(course.title)} | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">Python Mastery</a>
  </nav>
  <main class="container">
    <header class="hero">
      <h1>${escape(course.title)}</h1>
      <p class="subtitle">${escape(course.subtitle)}</p>
      <p class="description">${escape(course.description)}</p>
      <div class="meta">
        <span>${escape(course.duration)}</span>
        <span>${escape(course.schedule)}</span>
        <span>${escape(course.level)}</span>
        <span>${escape(course.focus)}</span>
      </div>
    </header>

    <section>
      <h2>Course Structure</h2>
      <p>Every 30-minute block follows: <strong>Concept → Examples → Exercise → Homework</strong>.</p>
      <div class="phases">
        ${phases.map(p => `
          <div class="phase-card">
            <h3>${escape(p.name)}</h3>
            <p><strong>Weeks ${escape(p.weeks)}</strong></p>
            <p>${escape(p.topics)}</p>
          </div>`).join('')}
      </div>
    </section>

    <section>
      <h2>Weeks</h2>
      <div class="week-grid">
        ${course.weeks.map(w => `
          <a href="/week/${w.id}.html" class="week-card">
            <span class="week-num">Week ${w.id}</span>
            <h3>${escape(w.title)}</h3>
            <p>${escape(w.theme)}</p>
          </a>`).join('')}
      </div>
    </section>
  </main>
</body>
</html>`;
}

// Write files
fs.writeFileSync(path.join(PUBLIC, 'index.html'), renderIndex());
course.weeks.forEach(w => {
  fs.writeFileSync(path.join(PUBLIC, 'week', `${w.id}.html`), renderWeek(w));
});
for (let i = 1; i <= 160; i++) {
  const block = blocks[i] || blocksMeta.find(b => b.id === i);
  if (block) {
    fs.writeFileSync(path.join(PUBLIC, 'block', `${i}.html`), renderBlock(block));
  }
}

// Copy styles
const styles = `/* Python Mastery - Course Styles */
:root {
  --bg: #0f1419;
  --surface: #1a2332;
  --text: #e6edf3;
  --muted: #8b949e;
  --accent: #58a6ff;
  --accent2: #3fb950;
  --border: #30363d;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}

.top-nav {
  background: var(--surface);
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}
.top-nav a {
  color: var(--accent);
  text-decoration: none;
}
.top-nav a:hover { text-decoration: underline; }

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  margin-bottom: 3rem;
}
.hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
.subtitle { font-size: 1.25rem; color: var(--muted); }
.description { margin: 1rem 0; }
.meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  color: var(--muted);
  font-size: 0.9rem;
}

section { margin: 2rem 0; }
section h2 {
  color: var(--accent);
  font-size: 1.25rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.phases, .week-grid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}
.phase-card, .week-card {
  background: var(--surface);
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--border);
}
.week-card {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: border-color 0.2s;
}
.week-card:hover { border-color: var(--accent); }
.week-card h3 { margin: 0.5rem 0; }
.week-card p { color: var(--muted); font-size: 0.9rem; margin: 0; }
.week-num { color: var(--accent); font-size: 0.85rem; }

.block-header { margin-bottom: 2rem; }
.badge {
  display: inline-block;
  background: var(--surface);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--muted);
  margin-bottom: 0.5rem;
}
.block-header h1 { font-size: 1.75rem; margin: 0.5rem 0; }
.objective { color: var(--muted); font-size: 1rem; }

.block-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
.block-card {
  background: var(--surface);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s;
}
.block-card:hover { border-color: var(--accent); }
.block-num { color: var(--accent); font-size: 0.8rem; }
.block-day { color: var(--muted); font-size: 0.8rem; margin-left: 0.5rem; }
.block-card h3 { margin: 0.5rem 0; font-size: 1rem; }

.code-block {
  margin: 1rem 0;
  background: #0d1117;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.code-block h4 {
  margin: 0;
  padding: 0.5rem 1rem;
  color: var(--muted);
  font-size: 0.85rem;
  border-bottom: 1px solid var(--border);
}
.code-block pre {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
}
.code-block code { color: var(--accent2); }

.problem {
  margin: 1rem 0;
  padding: 1rem;
  background: var(--surface);
  border-radius: 6px;
  border-left: 4px solid var(--accent);
}
.hint { margin-top: 0.5rem; color: var(--muted); font-size: 0.9rem; }

details { margin-top: 0.5rem; }
details summary { cursor: pointer; color: var(--accent); font-size: 0.9rem; }
.block-nav {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 1rem;
}
.block-nav a { color: var(--accent); text-decoration: none; }
.block-nav a:hover { text-decoration: underline; }

ul { padding-left: 1.5rem; }
li { margin: 0.5rem 0; }
.week-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
@media (max-width: 600px) {
  .container { padding: 1rem; }
  .top-nav { padding: 1rem; }
}
`;

fs.writeFileSync(path.join(PUBLIC, 'styles.css'), styles);

console.log('Build complete: public/index.html, public/week/*.html, public/block/*.html');
