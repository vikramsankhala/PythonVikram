/**
 * Express server: serves static site + Anthropic API proxy.
 * API key: ANTHROPIC_API_KEY env var (never exposed to client).
 */
const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(PUBLIC));

const COURSE_CONTEXT = `You are a helpful AI tutor for the Python Mastery course—a 16-week program covering Data Science, ML, and Scientific Computing. Topics include: Python foundations, NumPy, Pandas, Matplotlib/Seaborn, file I/O, APIs, web scraping, Flask/FastAPI, scikit-learn, SciPy, SymPy, statistics, NLP, Computer Vision, databases, ETL, testing, and capstone projects. Be concise, practical, and include code examples when relevant.`;

// Check API key
function requireApiKey(req, res, next) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'AI Assistant unavailable',
      message: 'ANTHROPIC_API_KEY is not configured. Add it in Render Environment settings.'
    });
  }
  next();
}

// POST /api/chat — Course Q&A
app.post('/api/chat', requireApiKey, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message required' });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const messages = [
      ...history.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: message }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: COURSE_CONTEXT,
      messages
    });

    const text = response.content?.find(b => b.type === 'text')?.text || 'No response.';
    res.json({ reply: text });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({
      error: 'AI request failed',
      message: err.message || 'Unknown error'
    });
  }
});

// POST /api/analyze-assessment — AI feedback on assessment answers
app.post('/api/analyze-assessment', requireApiKey, async (req, res) => {
  try {
    const { week, answers, score, questions } = req.body;
    if (!week || !answers) {
      return res.status(400).json({ error: 'week and answers required' });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = `You are grading a Week ${week} assessment for the Python Mastery course.

Questions and student answers:
${JSON.stringify(questions || [], null, 2)}

Student answers provided:
${typeof answers === 'object' ? JSON.stringify(answers, null, 2) : answers}

Score: ${score || 'N/A'}

Provide:
1. Brief strengths (what they got right)
2. Gaps or mistakes to review
3. 2-3 focused recommendations for improvement
4. Suggested blocks or topics to revisit

Keep it under 200 words, encouraging and actionable.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      system: COURSE_CONTEXT,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content?.find(b => b.type === 'text')?.text || 'No analysis.';
    res.json({ analysis: text });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({
      error: 'Analysis failed',
      message: err.message || 'Unknown error'
    });
  }
});

// POST /api/study-advice — Personalized study strategy
app.post('/api/study-advice', requireApiKey, async (req, res) => {
  try {
    const { completedBlocks, currentWeek, goal } = req.body;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = `You are a study coach for Python Mastery (16 weeks, 160 blocks).

Student status:
- Blocks completed: ${completedBlocks ?? 'unknown'}
- Current week: ${currentWeek ?? 'unknown'}
- Goal/context: ${goal || 'general progress'}

Give brief, actionable advice (3-5 bullet points): daily schedule tips, what to focus on, how to catch up or stay on track. Under 150 words.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 384,
      system: COURSE_CONTEXT,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content?.find(b => b.type === 'text')?.text || 'No advice.';
    res.json({ advice: text });
  } catch (err) {
    console.error('Study advice error:', err);
    res.status(500).json({
      error: 'Advice failed',
      message: err.message || 'Unknown error'
    });
  }
});

// POST /api/career-guidance — Career path advice
app.post('/api/career-guidance', requireApiKey, async (req, res) => {
  try {
    const { role, skills, experience } = req.body;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = `You are a career advisor for Python/data roles.

Target role: ${role || 'Data Scientist'}
Current skills: ${skills || 'beginner'}
Experience: ${experience || 'learning'}

Give 4-5 specific, actionable tips: skills to prioritize, projects to build, interview prep. Connect to Python Mastery course topics. Under 180 words.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      system: COURSE_CONTEXT,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content?.find(b => b.type === 'text')?.text || 'No guidance.';
    res.json({ guidance: text });
  } catch (err) {
    console.error('Career guidance error:', err);
    res.status(500).json({
      error: 'Guidance failed',
      message: err.message || 'Unknown error'
    });
  }
});

// POST /api/code-help — Debug or explain code
app.post('/api/code-help', requireApiKey, async (req, res) => {
  try {
    const { code, question, context } = req.body;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = `Python Mastery student needs help:

Question: ${question || 'Please explain or fix this code'}
Context: ${context || 'From the course'}

Code:
\`\`\`python
${code || '# No code provided'}
\`\`\`

Provide a clear explanation or corrected code. Include comments if fixing.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: COURSE_CONTEXT,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content?.find(b => b.type === 'text')?.text || 'No help.';
    res.json({ reply: text });
  } catch (err) {
    console.error('Code help error:', err);
    res.status(500).json({
      error: 'Request failed',
      message: err.message || 'Unknown error'
    });
  }
});

// 404 for unknown API routes; static files handled by express.static

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not set — AI features will return 503');
  }
});
