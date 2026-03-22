const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');
const CONTENT = path.join(BASE, 'content');
const PUBLIC = path.join(BASE, 'public');

// Ensure public dir exists
if (!fs.existsSync(PUBLIC)) fs.mkdirSync(PUBLIC, { recursive: true });
if (!fs.existsSync(path.join(PUBLIC, 'block'))) fs.mkdirSync(path.join(PUBLIC, 'block'), { recursive: true });
if (!fs.existsSync(path.join(PUBLIC, 'week'))) fs.mkdirSync(path.join(PUBLIC, 'week'), { recursive: true });
if (!fs.existsSync(path.join(PUBLIC, 'assessment'))) fs.mkdirSync(path.join(PUBLIC, 'assessment'), { recursive: true });
if (!fs.existsSync(path.join(PUBLIC, 'topics'))) fs.mkdirSync(path.join(PUBLIC, 'topics'), { recursive: true });

// Load data
const course = JSON.parse(fs.readFileSync(path.join(CONTENT, 'course-structure.json'), 'utf8'));
const blocksMeta = JSON.parse(fs.readFileSync(path.join(CONTENT, 'blocks-metadata.json'), 'utf8'));
let weekResources = { weeks: [] };
let careers = { jobs: [] };
let pricing = { ourPricing: {}, comparison: [] };
let weekAssessments = { assessments: [] };
try {
  weekResources = JSON.parse(fs.readFileSync(path.join(CONTENT, 'week-resources.json'), 'utf8'));
} catch (e) { console.warn('week-resources.json not found'); }
try {
  careers = JSON.parse(fs.readFileSync(path.join(CONTENT, 'careers.json'), 'utf8'));
} catch (e) { console.warn('careers.json not found'); }
try {
  pricing = JSON.parse(fs.readFileSync(path.join(CONTENT, 'pricing.json'), 'utf8'));
} catch (e) { console.warn('pricing.json not found'); }
try {
  weekAssessments = JSON.parse(fs.readFileSync(path.join(CONTENT, 'week-assessments.json'), 'utf8'));
} catch (e) { console.warn('week-assessments.json not found'); }
let topicsData = { topics: [] };
try {
  topicsData = JSON.parse(fs.readFileSync(path.join(CONTENT, 'topics.json'), 'utf8'));
} catch (e) { console.warn('topics.json not found'); }

const getWeekResources = (weekId) => weekResources.weeks.find(r => r.week === weekId) || {};

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
  const res = getWeekResources(week.id);
  const yt = (res.youtube || []).slice(0, 20);
  const cheatSheets = res.cheatSheets || [];
  const snippets = res.codeSnippets || [];
  const viz = res.visualizations || [];
  const strategy = res.strategyGuidance || '';

  let ytHtml = '';
  if (yt.length) {
    ytHtml = `
    <section>
      <h2>📺 20 Curated YouTube Videos</h2>
      <div class="youtube-grid">
        ${yt.map(v => `
          <a href="${escape(v.url || 'https://www.youtube.com/watch?v=' + v.id)}" target="_blank" rel="noopener" class="yt-card">
            <span class="yt-thumb">▶ ${escape(v.title || v.channel)}</span>
            <span class="yt-channel">${escape(v.channel || '')}</span>
          </a>`).join('')}
      </div>
    </section>`;
  }

  let cheatHtml = '';
  if (cheatSheets.length) {
    cheatHtml = `
    <section>
      <h2>📋 Cheat Sheets</h2>
      <div class="cheat-grid">
        ${cheatSheets.map(c => `
          <div class="cheat-card">
            <h4>${escape(c.title)}</h4>
            <pre class="cheat-pre">${escape(c.content)}</pre>
          </div>`).join('')}
      </div>
    </section>`;
  }

  let snippetHtml = '';
  if (snippets.length) {
    snippetHtml = `
    <section>
      <h2>💻 Code Snippets</h2>
      <div class="snippet-list">
        ${snippets.map(s => `
          <div class="code-block">
            <h4>${escape(s.title)}</h4>
            <pre><code>${escape(s.code)}</code></pre>
          </div>`).join('')}
      </div>
    </section>`;
  }

  let vizHtml = '';
  if (viz.length) {
    vizHtml = `
    <section>
      <h2>📊 Visualizations &amp; Diagrams</h2>
      <div class="viz-list">
        ${viz.map(v => `
          <div class="viz-card">
            <h4>${escape(v.title)}</h4>
            <pre class="viz-pre">${escape(v.content)}</pre>
            ${v.type === 'mermaid' ? '<p class="viz-note">Paste into <a href="https://mermaid.live" target="_blank">mermaid.live</a> to render</p>' : ''}
          </div>`).join('')}
      </div>
    </section>`;
  }

  const assessment = weekAssessments.assessments.find(a => a.week === week.id);
  const assessmentLink = assessment ? `<a href="/assessment/${week.id}.html" class="assessment-cta">📝 Week ${week.id} Assessment (Practice + AI Analysis)</a>` : '';

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
    <a href="/progress.html">Progress</a>
  </nav>
  <main class="container">
    <h1>Week ${week.id}: ${escape(week.title)}</h1>
    <p class="theme">${escape(week.theme)}</p>

    ${strategy ? `<section><h2>📌 Strategy &amp; Study Guidance</h2><p class="strategy-box">${escape(strategy)}</p></section>` : ''}

    <section>
      <h2>Blocks</h2>
      <div class="block-list">
        ${weekBlocks.map(b => `
          <a href="/block/${b.id}.html" class="block-card">
            <span class="block-num">Block ${b.id}</span>
            <span class="block-day">${b.day}</span>
            <h3>${escape(b.title)}</h3>
          </a>`).join('')}
      </div>
    </section>
    ${ytHtml}
    ${cheatHtml}
    ${snippetHtml}
    ${vizHtml}
    ${assessmentLink ? `<section><h2>Assessment</h2>${assessmentLink}</section>` : ''}
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
    <a href="/#extended-topics">📚 Topics</a>
    <a href="/progress.html">📊 Progress</a>
    <a href="/careers.html">💼 Careers</a>
    <a href="/pricing.html">💰 Pricing</a>
    <a href="/ai-assistant.html">🤖 AI Assistant</a>
  </nav>
  <div class="trailer-wrapper">
    <a href="#course-structure" class="skip-trailer">Skip to course &rarr;</a>
    <iframe src="/trailer.html" title="Python Mastery Course Trailer" class="course-trailer-iframe" id="course-trailer-iframe"></iframe>
  </div>
  <main class="container" id="course-structure">
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

    <section id="extended-topics">
      <h2>Extended Topics</h2>
      <p>Dive deeper into visualization, vibe coding, SaaS, and DevOps.</p>
      <div class="topic-grid">
        ${(topicsData.topics || []).map(t => `
          <a href="/topics/${t.id}.html" class="topic-card">
            <span class="topic-icon">${t.icon || '📌'}</span>
            <h3>${escape(t.title)}</h3>
            <p>${escape(t.description)}</p>
          </a>`).join('')}
      </div>
    </section>

    <section>
      <h2>Resources &amp; Tools</h2>
      <div class="resource-links">
        <a href="/coursebook.html" class="coursebook-link">📖 Complete Course Book</a>
        <a href="/progress.html" class="coursebook-link">📊 Progress Monitor &amp; Study Calendar</a>
        <a href="/careers.html" class="coursebook-link">💼 Python Careers &amp; Job Paths</a>
        <a href="/pricing.html" class="coursebook-link">💰 Pricing &amp; Course Comparison</a>
        <a href="/ai-assistant.html" class="coursebook-link">🤖 AI Assistant (Claude)</a>
      </div>
    </section>
  </main>
</body>
</html>`;
}

function renderCareers() {
  const jobs = careers.jobs || [];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Python Careers | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">← Course</a>
    <a href="/careers.html">Careers</a>
  </nav>
  <main class="container">
    <h1>${escape(careers.title || 'Python Careers')}</h1>
    <p class="description">${escape(careers.description || '')}</p>
    <section class="ai-career-section">
      <h2>🤖 Get AI Career Guidance</h2>
      <form id="career-guidance-form">
        <select id="career-role">
          <option value="">Select a role...</option>
          ${(careers.jobs || []).map(j => `<option value="${escape(j.title)}">${escape(j.title)}</option>`).join('')}
        </select>
        <input type="text" id="career-skills" placeholder="Your current skills" />
        <input type="text" id="career-experience" placeholder="Experience level" />
        <button type="submit">Get Guidance</button>
      </form>
      <div id="career-guidance-result" class="ai-career-result"></div>
    </section>
    <div class="jobs-grid">
      ${jobs.map(j => `
        <div class="job-card">
          <h3>${escape(j.title)}</h3>
          <p class="job-salary">${escape(j.salaryRange)}</p>
          <p class="job-demand">Demand: ${escape(j.demand)}</p>
          <h4>Skills Required</h4>
          <ul>${(j.skills || []).map(s => `<li>${escape(s)}</li>`).join('')}</ul>
          <h4>Relevant Course Weeks</h4>
          <p>Weeks ${(j.courseWeeks || []).join(', ')}</p>
          <h4>Assessment</h4>
          <p>${escape(j.assessment || '')}</p>
        </div>`).join('')}
    </div>
  </main>
  <script>
    document.getElementById('career-guidance-form').onsubmit=function(e){
      e.preventDefault();
      var role=document.getElementById('career-role').value;
      var skills=document.getElementById('career-skills').value||'beginner';
      var exp=document.getElementById('career-experience').value||'learning';
      var out=document.getElementById('career-guidance-result');
      if(!role){out.innerHTML='<p class="error">Select a role first.</p>';return;}
      out.innerHTML='<em>Loading...</em>';
      fetch(window.location.origin+'/api/career-guidance',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({role:role,skills:skills,experience:exp})
      })
      .then(function(r){if(!r.ok)throw new Error('Request failed');return r.json();})
      .then(function(d){out.innerHTML='<div class="ai-feedback">'+d.guidance.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>')+'</div>';})
      .catch(function(e){out.innerHTML='<p class="error">'+e.message+'</p>';});
    };
  </script>
</body>
</html>`;
}

function renderPricing() {
  const our = pricing.ourPricing || {};
  const comp = pricing.comparison || [];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pricing &amp; Comparison | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">← Course</a>
  </nav>
  <main class="container">
    <h1>${escape(pricing.title || 'Pricing & Course Comparison')}</h1>
    <section>
      <h2>Our Pricing</h2>
      <div class="pricing-grid">
        ${Object.entries(our).map(([k, v]) => `
          <div class="price-card">
            <h3>${escape(v.name)}</h3>
            <p class="price">${escape(v.price)}</p>
            <ul>${(v.features || []).map(f => `<li>${escape(f)}</li>`).join('')}</ul>
            ${(v.limitations || []).length ? `<p class="limits">${(v.limitations || []).map(l => escape(l)).join('; ')}</p>` : ''}
          </div>`).join('')}
      </div>
    </section>
    <section>
      <h2>Comparative Assessment</h2>
      <div class="comparison-table">
        ${comp.map(c => `
          <div class="comp-card">
            <h3>${escape(c.name)}</h3>
            <p><strong>Price:</strong> ${escape(c.price)} | <strong>Duration:</strong> ${escape(c.duration)}</p>
            <p>${escape(c.focus)}</p>
            <h4>Pros</h4><ul>${(c.pros || []).map(p => `<li>${escape(p)}</li>`).join('')}</ul>
            <h4>Cons</h4><ul>${(c.cons || []).map(c => `<li>${escape(c)}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>
    </section>
  </main>
</body>
</html>`;
}

function renderProgress() {
  const totalBlocks = 160;
  const weeks = course.weeks || [];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Progress Monitor &amp; Study Tracker | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">← Course</a>
    <a href="/progress.html">Progress</a>
  </nav>
  <main class="container">
    <h1>📊 Progress Monitor &amp; Study Tracker</h1>
    <section>
      <h2>Study Calendar</h2>
      <p>16 weeks × 5 days × 2 blocks/day = 160 blocks. Check off as you complete.</p>
      <div class="calendar-grid">
        ${weeks.map(w => `
          <div class="calendar-week">
            <h4>Week ${w.id}</h4>
            <p>${escape(w.title)}</p>
            <div class="block-checks">
              ${Array.from({ length: 10 }, (_, i) => (w.id - 1) * 10 + i + 1).map(bid => `
                <label class="check-label"><input type="checkbox" data-block="${bid}"> B${bid}</label>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </section>
    <section>
      <h2>Progress Tracker</h2>
      <div class="progress-bar-wrap">
        <div id="progress-bar" class="progress-bar" style="width: 0%"></div>
      </div>
      <p id="progress-text">0 / ${totalBlocks} blocks completed</p>
    </section>
    <section class="ai-advice-section">
      <h2>🤖 Get AI Study Advice</h2>
      <p>Based on your progress, Claude will suggest a study plan.</p>
      <form id="study-advice-form">
        <input type="number" id="advice-week" placeholder="Current week (1-16)" min="1" max="16" />
        <input type="text" id="advice-goal" placeholder="Goal (e.g. catch up, stay ahead)" />
        <button type="submit">Get Advice</button>
      </form>
      <div id="study-advice-result" class="ai-advice-result"></div>
    </section>
    <section>
      <h2>Study Strategy by Week</h2>
      <div class="strategy-list">
        ${(weekResources.weeks || []).map(r => `
          <div class="strategy-item">
            <h4>Week ${r.week}: ${escape(r.title || course.weeks.find(w=>w.id===r.week)?.title || '')}</h4>
            <p>${escape(r.strategyGuidance || 'Review blocks and complete exercises.')}</p>
          </div>`).join('')}
        ${(!weekResources.weeks || weekResources.weeks.length === 0) ? '<p>Complete 2 blocks per day. Review previous week before starting new content.</p>' : ''}
      </div>
    </section>
    <script>
      (function(){
        var k='python-mastery-progress';
        var done=JSON.parse(localStorage.getItem(k)||'[]');
        function save(){localStorage.setItem(k,JSON.stringify(done));update();}
        function update(){
          var c=document.querySelectorAll('input[data-block]');
          c.forEach(function(i){
            i.checked=done.indexOf(parseInt(i.dataset.block))>=0;
            i.onchange=function(){
              if(i.checked)done.push(parseInt(i.dataset.block));
              else done=done.filter(function(x){return x!==parseInt(i.dataset.block);});
              save();
            };
          });
          var pct=Math.round(done.length/160*100);
          var bar=document.getElementById('progress-bar');
          var txt=document.getElementById('progress-text');
          if(bar){bar.style.width=pct+'%';}
          if(txt){txt.textContent=done.length+' / 160 blocks completed ('+pct+'%)';}
        }
        update();
        document.getElementById('study-advice-form').onsubmit=function(e){
          e.preventDefault();
          var done=JSON.parse(localStorage.getItem('python-mastery-progress')||'[]');
          var week=document.getElementById('advice-week').value||Math.ceil(done.length/10);
          var goal=document.getElementById('advice-goal').value||'general progress';
          var out=document.getElementById('study-advice-result');
          out.innerHTML='<em>Loading...</em>';
          fetch(window.location.origin+'/api/study-advice',{
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({completedBlocks:done.length,currentWeek:week,goal:goal})
          })
          .then(function(r){if(!r.ok)throw new Error('Request failed');return r.json();})
          .then(function(d){out.innerHTML='<div class="ai-feedback">'+d.advice.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>')+'</div>';})
          .catch(function(e){out.innerHTML='<p class="error">'+e.message+'</p>';});
        };
      })();
    </script>
  </main>
</body>
</html>`;
}

function renderAIAssistant() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Assistant (Claude) | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">← Course</a>
  </nav>
  <main class="container">
    <h1>🤖 Anthropic AI Assistant (Claude)</h1>
    <p>Ask questions about the Python Mastery course. Get help with concepts, code, and exercises.</p>

    <section class="ai-chat-section">
      <div id="chat-messages" class="chat-messages"></div>
      <form id="chat-form" class="chat-form">
        <textarea id="chat-input" rows="2" placeholder="Ask about NumPy, Pandas, Flask, ML, etc..." required></textarea>
        <button type="submit">Send</button>
      </form>
      <p id="chat-status" class="chat-status"></p>
    </section>

    <section class="ai-box">
      <h2>Code Help</h2>
      <p>Paste your code and ask for an explanation or fix:</p>
      <form id="code-help-form" class="code-help-form">
        <textarea id="code-input" rows="6" placeholder="# Your Python code here"></textarea>
        <input type="text" id="code-question" placeholder="What do you need? (e.g. Fix this error, explain this)" />
        <button type="submit">Get AI Help</button>
      </form>
      <div id="code-help-reply" class="code-help-reply"></div>
    </section>

    <section class="ai-box">
      <h2>Example Questions</h2>
      <ul>
        <li>Explain NumPy broadcasting with an example.</li>
        <li>How do I use groupby in Pandas?</li>
        <li>What's the difference between Flask and FastAPI?</li>
        <li>Help me debug this scikit-learn pipeline.</li>
      </ul>
      <p class="ai-note">Requires <code>ANTHROPIC_API_KEY</code> in Render Environment. Key stays server-side, never exposed.</p>
    </section>
  </main>
  <script>
    (function(){
      var api = window.location.origin + '/api';
      var messages = [];

      function addMsg(role, text) {
        var div = document.getElementById('chat-messages');
        var el = document.createElement('div');
        el.className = 'chat-msg chat-' + role;
        el.innerHTML = '<strong>' + (role === 'user' ? 'You' : 'Claude') + ':</strong> ' + text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\n/g, '<br>');
        div.appendChild(el);
        div.scrollTop = div.scrollHeight;
      }

      function setStatus(s, isErr) {
        var el = document.getElementById('chat-status');
        el.textContent = s;
        el.className = 'chat-status' + (isErr ? ' error' : '');
      }

      document.getElementById('chat-form').onsubmit = function(e) {
        e.preventDefault();
        var inp = document.getElementById('chat-input');
        var msg = inp.value.trim();
        if (!msg) return;
        addMsg('user', msg);
        messages.push({ role: 'user', content: msg });
        inp.value = '';
        setStatus('Thinking...');
        fetch(api + '/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg, history: messages.slice(0, -1) })
        })
        .then(function(r) {
          if (!r.ok) return r.json().then(function(d) { throw new Error(d.message || d.error || 'Request failed'); });
          return r.json();
        })
        .then(function(d) {
          addMsg('assistant', d.reply);
          messages.push({ role: 'assistant', content: d.reply });
          setStatus('');
        })
        .catch(function(err) {
          setStatus(err.message || 'Failed', true);
        });
      };

      document.getElementById('code-help-form').onsubmit = function(e) {
        e.preventDefault();
        var code = document.getElementById('code-input').value;
        var question = document.getElementById('code-question').value || 'Explain or fix this code';
        var out = document.getElementById('code-help-reply');
        out.innerHTML = '<em>Getting AI help...</em>';
        fetch(api + '/code-help', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code, question: question })
        })
        .then(function(r) {
          if (!r.ok) return r.json().then(function(d) { throw new Error(d.message || d.error || 'Request failed'); });
          return r.json();
        })
        .then(function(d) {
          out.innerHTML = '<pre>' + d.reply.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>';
        })
        .catch(function(err) {
          out.innerHTML = '<p class="error">' + err.message + '</p>';
        });
      };
    })();
  </script>
</body>
</html>`;
}

function renderTopic(topic) {
  let librariesHtml = '';
  if (topic.libraries && topic.libraries.length) {
    librariesHtml = `
    <section>
      <h2>Libraries &amp; Tools</h2>
      <ul class="topic-list">
        ${topic.libraries.map(l => `<li><strong>${escape(l.name)}</strong>: ${escape(l.use)}</li>`).join('')}
      </ul>
    </section>`;
  }
  let stackHtml = '';
  if (topic.stack && topic.stack.length) {
    stackHtml = `
    <section>
      <h2>Stack</h2>
      <ul class="topic-list">
        ${topic.stack.map(s => `<li><strong>${escape(s.layer)}</strong>: ${escape(Array.isArray(s.tools) ? s.tools.join(', ') : (s.tools || ''))}</li>`).join('')}
      </ul>
    </section>`;
  }
  let toolsHtml = '';
  if (topic.tools && topic.tools.length) {
    toolsHtml = `
    <section>
      <h2>Tools</h2>
      <ul class="topic-list">
        ${topic.tools.map(t => `<li><strong>${escape(t.name)}</strong>: ${escape(t.use)}</li>`).join('')}
      </ul>
    </section>`;
  }
  const conceptsHtml = (topic.concepts || []).length ? `
    <section>
      <h2>Key Concepts</h2>
      <ul>${topic.concepts.map(c => `<li>${escape(c)}</li>`).join('')}</ul>
    </section>` : '';
  const workflowHtml = (topic.workflow || []).length ? `
    <section>
      <h2>Workflow</h2>
      <ol>${topic.workflow.map(w => `<li>${escape(w)}</li>`).join('')}</ol>
    </section>` : '';
  const bestPracticesHtml = (topic.bestPractices || []).length ? `
    <section>
      <h2>Best Practices</h2>
      <ul>${topic.bestPractices.map(b => `<li>${escape(b)}</li>`).join('')}</ul>
    </section>` : '';
  const pipelineHtml = (topic.pipeline || []).length ? `
    <section>
      <h2>Pipeline</h2>
      <ul>${topic.pipeline.map(p => `<li>${escape(p)}</li>`).join('')}</ul>
    </section>` : '';
  const codeHtml = topic.codeSnippet ? `
    <section>
      <h2>Code Example</h2>
      <div class="code-block">
        <pre><code>${escape(topic.codeSnippet)}</code></pre>
      </div>
    </section>` : '';
  const resourcesHtml = (topic.resources || []).length ? `
    <section>
      <h2>Resources</h2>
      <ul>
        ${topic.resources.map(r => `<li><a href="${escape(r.url)}" target="_blank" rel="noopener">${escape(r.title)}</a></li>`).join('')}
      </ul>
    </section>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escape(topic.title)} | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">← Course</a>
    <a href="/#extended-topics">Extended Topics</a>
  </nav>
  <main class="container">
    <header class="topic-header">
      <span class="topic-icon">${topic.icon || '📌'}</span>
      <h1>${escape(topic.title)}</h1>
      <p class="description">${escape(topic.description)}</p>
    </header>
    ${conceptsHtml}
    ${librariesHtml}
    ${stackHtml}
    ${toolsHtml}
    ${workflowHtml}
    ${bestPracticesHtml}
    ${pipelineHtml}
    ${codeHtml}
    ${resourcesHtml}
  </main>
</body>
</html>`;
}

function renderWeekAssessment(assessment) {
  const qHtml = (assessment.questions || []).map((q, i) => {
    if (q.type === 'mcq') {
      return `
        <div class="aq-question">
          <p><strong>${i + 1}. ${escape(q.q)}</strong></p>
          <div class="aq-options">
            ${(q.options || []).map((o, j) => `
              <label><input type="radio" name="q${q.id}" value="${j}"> ${escape(o)}</label>`).join('<br>')}
          </div>
        </div>`;
    }
    return `
      <div class="aq-question">
        <p><strong>${i + 1}. ${escape(q.q)}</strong></p>
        <textarea name="q${q.id}" rows="4" placeholder="Write your code or answer..."></textarea>
      </div>`;
  }).join('');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Week ${assessment.week} Assessment | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">← Course</a>
    <a href="/week/${assessment.week}.html">Week ${assessment.week}</a>
  </nav>
  <main class="container">
    <h1>📝 Week ${assessment.week} Assessment</h1>
    <p>${escape(assessment.title || '')}</p>
    <form id="assessment-form">
      ${qHtml}
      <button type="submit">Submit for Grading</button>
    </form>
    <section id="results" class="hidden">
      <h2>Results</h2>
      <p id="score"></p>
      <p id="ai-analysis"></p>
      <button type="button" id="get-ai-analysis" class="ai-analysis-btn">Get AI Feedback (Claude)</button>
      <div id="ai-analysis-result" class="ai-analysis-result hidden"></div>
    </section>
    <script>
      var assessmentData = ${JSON.stringify({ week: assessment.week, questions: assessment.questions || [] })};
      document.getElementById('assessment-form').onsubmit=function(e){
        e.preventDefault();
        var ans=${JSON.stringify((assessment.questions || []).map(q => ({ id: q.id, type: q.type, answer: q.answer, solution: q.solution })))};
        var correct=0;
        var answers={};
        ans.forEach(function(a,i){
          var el=document.querySelector('[name="q'+a.id+'"]');
          if(!el)return;
          var v=el.type==='radio'?(document.querySelector('[name="q'+a.id+']:checked')?parseInt(document.querySelector('[name="q'+a.id+']:checked').value):-1):el.value.trim();
          answers['q'+a.id]=v;
          if(a.type==='mcq'&&v===a.answer)correct++;
          if(a.type==='code'&&v&&v.length>0)correct++;
        });
        var total=ans.length;
        var pct=Math.round(correct/total*100);
        document.getElementById('score').textContent='Score: '+correct+'/'+total+' ('+pct+'%). Passing: '+(assessment.passingScore||70)+'%';
        document.getElementById('ai-analysis').innerHTML='<strong>Tip:</strong> Click "Get AI Feedback" for personalized analysis.';
        document.getElementById('results').classList.remove('hidden');
        window._lastAnswers = answers;
        window._lastScore = correct+'/'+total+' ('+pct+'%)';
      };
      document.getElementById('get-ai-analysis').onclick=function(){
        var btn=this;
        var out=document.getElementById('ai-analysis-result');
        if(!window._lastAnswers){ out.textContent='Submit the assessment first.'; out.classList.remove('hidden'); return; }
        btn.disabled=true;
        out.innerHTML='<em>Analyzing...</em>';
        out.classList.remove('hidden');
        fetch(window.location.origin+'/api/analyze-assessment',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            week:assessmentData.week,
            answers:window._lastAnswers,
            score:window._lastScore,
            questions:assessmentData.questions
          })
        })
        .then(function(r){ if(!r.ok) throw new Error('Request failed'); return r.json(); })
        .then(function(d){
          out.innerHTML='<div class="ai-feedback">'+d.analysis.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\\n/g,'<br>')+'</div>';
        })
        .catch(function(e){ out.innerHTML='<p class="error">'+e.message+' (Is ANTHROPIC_API_KEY set?)</p>'; })
        .finally(function(){ btn.disabled=false; });
      };
    </script>
  </main>
</body>
</html>`;
}

function renderCoursebook() {
  const coursebookPath = path.join(CONTENT, 'coursebook.txt');
  let content = '';
  if (fs.existsSync(coursebookPath)) {
    content = fs.readFileSync(coursebookPath, 'utf8');
    // Escape only < and > to prevent breaking HTML; preserve &amp; &lt; &gt; etc.
    content = content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Course Book | Python Mastery</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <nav class="top-nav">
    <a href="/">← Course</a>
    <a href="/week/1.html">Weeks</a>
  </nav>
  <main class="container coursebook-container">
    <header class="coursebook-header">
      <h1>Python Mastery — Complete Course Book</h1>
      <p class="coursebook-subtitle">Full contents from python_mastery_coursebook.docx, exactly as in the original document.</p>
    </header>
    <article class="coursebook-content">
      <pre class="coursebook-pre">${content}</pre>
    </article>
  </main>
</body>
</html>`;
}

// Copy trailer to public
const trailerPath = path.join(CONTENT, 'trailer-standalone.html');
const trailerAltPath = path.join(BASE, 'python_mastery_course_trailer.html');
let trailerHtml = '';
if (fs.existsSync(trailerPath)) {
  trailerHtml = fs.readFileSync(trailerPath, 'utf8');
} else if (fs.existsSync(trailerAltPath)) {
  trailerHtml = fs.readFileSync(trailerAltPath, 'utf8');
}
if (trailerHtml) {
  fs.writeFileSync(path.join(PUBLIC, 'trailer.html'), trailerHtml);
}

// Write files
fs.writeFileSync(path.join(PUBLIC, 'index.html'), renderIndex());
fs.writeFileSync(path.join(PUBLIC, 'coursebook.html'), renderCoursebook());
fs.writeFileSync(path.join(PUBLIC, 'careers.html'), renderCareers());
fs.writeFileSync(path.join(PUBLIC, 'pricing.html'), renderPricing());
fs.writeFileSync(path.join(PUBLIC, 'progress.html'), renderProgress());
fs.writeFileSync(path.join(PUBLIC, 'ai-assistant.html'), renderAIAssistant());
course.weeks.forEach(w => {
  fs.writeFileSync(path.join(PUBLIC, 'week', `${w.id}.html`), renderWeek(w));
});
(weekAssessments.assessments || []).forEach(a => {
  fs.writeFileSync(path.join(PUBLIC, 'assessment', `${a.week}.html`), renderWeekAssessment(a));
});
(topicsData.topics || []).forEach(t => {
  fs.writeFileSync(path.join(PUBLIC, 'topics', `${t.id}.html`), renderTopic(t));
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

.coursebook-link {
  display: inline-block;
  padding: 1rem 1.5rem;
  background: var(--surface);
  border: 1px solid var(--accent);
  border-radius: 8px;
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  margin: 1rem 0;
}
.coursebook-link:hover { background: rgba(88, 166, 255, 0.1); }

.coursebook-container { max-width: 900px; }
.coursebook-header { margin-bottom: 2rem; }
.coursebook-subtitle { color: var(--muted); font-size: 0.95rem; }
.coursebook-content { margin: 2rem 0; }
.coursebook-pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  padding: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow-x: auto;
}

.topic-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem; }
.topic-card { background: var(--surface); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border); text-decoration: none; color: inherit; transition: border-color 0.2s; }
.topic-card:hover { border-color: var(--accent); }
.topic-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
.topic-header { margin-bottom: 2rem; }
.topic-header .topic-icon { font-size: 2.5rem; }
.topic-list { padding-left: 1.5rem; }
.resource-links { display: flex; flex-direction: column; gap: 0.75rem; }
.resource-links .coursebook-link { display: inline-block; }
.youtube-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
.yt-card { background: var(--surface); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border); text-decoration: none; color: inherit; display: block; }
.yt-card:hover { border-color: var(--accent); }
.yt-channel { font-size: 0.8rem; color: var(--muted); }
.cheat-grid, .snippet-list, .viz-list { display: flex; flex-direction: column; gap: 1rem; }
.cheat-card, .viz-card { background: var(--surface); padding: 1rem; border-radius: 6px; border: 1px solid var(--border); }
.cheat-pre, .viz-pre { font-size: 0.85rem; white-space: pre-wrap; background: #0d1117; padding: 0.75rem; border-radius: 4px; margin: 0.5rem 0; }
.viz-note { font-size: 0.85rem; color: var(--muted); }
.strategy-box { background: var(--surface); padding: 1rem; border-radius: 6px; border-left: 4px solid var(--accent); }
.assessment-cta { display: inline-block; padding: 0.75rem 1rem; background: var(--accent2); color: var(--bg); border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 0.5rem; }
.assessment-cta:hover { opacity: 0.9; }
.jobs-grid { display: grid; gap: 1.5rem; }
.job-card { background: var(--surface); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border); }
.job-salary, .job-demand { color: var(--accent); font-weight: 500; }
.pricing-grid, .comparison-table { display: grid; gap: 1rem; }
.price-card, .comp-card { background: var(--surface); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border); }
.price { font-size: 1.5rem; color: var(--accent2); }
.limits { color: var(--muted); font-size: 0.9rem; }
.calendar-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.calendar-week { background: var(--surface); padding: 1rem; border-radius: 6px; border: 1px solid var(--border); }
.block-checks { display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.5rem; }
.check-label { font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.25rem; }
.progress-bar-wrap { height: 24px; background: var(--surface); border-radius: 4px; overflow: hidden; margin: 1rem 0; }
.progress-bar { height: 100%; background: var(--accent2); transition: width 0.3s; }
.strategy-list { display: flex; flex-direction: column; gap: 1rem; }
.strategy-item { background: var(--surface); padding: 1rem; border-radius: 6px; }
.ai-box { background: var(--surface); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border); }
.ai-chat-section { margin: 2rem 0; }
.chat-messages { max-height: 320px; overflow-y: auto; background: var(--surface); padding: 1rem; border-radius: 6px; margin-bottom: 1rem; border: 1px solid var(--border); }
.chat-msg { margin: 0.5rem 0; }
.chat-user { color: var(--accent); }
.chat-form { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.chat-form textarea { flex: 1; font-family: inherit; padding: 0.5rem; border-radius: 4px; background: var(--surface); border: 1px solid var(--border); color: var(--text); }
.chat-form button { padding: 0.5rem 1rem; background: var(--accent); color: var(--bg); border: none; border-radius: 4px; cursor: pointer; }
.chat-status { font-size: 0.9rem; color: var(--muted); margin-top: 0.5rem; }
.chat-status.error { color: #f85149; }
.code-help-form { display: flex; flex-direction: column; gap: 0.5rem; }
.code-help-form textarea, .code-help-form input { font-family: monospace; padding: 0.5rem; background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 4px; }
.code-help-reply { margin-top: 1rem; }
.code-help-reply pre { white-space: pre-wrap; }
.ai-note { font-size: 0.85rem; color: var(--muted); margin-top: 1rem; }
.ai-analysis-btn { padding: 0.5rem 1rem; background: var(--accent); color: var(--bg); border: none; border-radius: 4px; cursor: pointer; margin-top: 0.5rem; }
.ai-analysis-result { margin-top: 1rem; padding: 1rem; background: var(--surface); border-radius: 6px; }
.ai-feedback { line-height: 1.6; }
.ai-advice-section, .ai-career-section { margin: 2rem 0; }
.ai-advice-result, .ai-career-result { margin-top: 1rem; }
.trailer-wrapper { position: relative; width: 100%; }
.skip-trailer {
  position: absolute; top: 12px; right: 16px; z-index: 10;
  padding: 8px 16px; background: rgba(0,0,0,0.6); color: #e6edf3;
  border-radius: 6px; text-decoration: none; font-size: 0.9rem;
  border: 1px solid rgba(255,255,255,0.2);
}
.skip-trailer:hover { background: rgba(0,0,0,0.8); color: #58a6ff; }
.course-trailer-iframe {
  width: 100%; height: 520px; border: none; display: block;
}
.aq-question { margin: 1.5rem 0; }
.aq-options label { display: block; margin: 0.5rem 0; }
.aq-question textarea { width: 100%; font-family: monospace; }
.hidden { display: none !important; }

@media (max-width: 600px) {
  .container { padding: 1rem; }
  .top-nav { padding: 1rem; }
}
`;

fs.writeFileSync(path.join(PUBLIC, 'styles.css'), styles);

console.log('Build complete: public/index.html, public/week/*.html, public/block/*.html');
