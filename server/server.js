require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { validateThought, performAnalyze, performChat, mapOpenAIError } = require('./lib/analyzeThought');

if (!process.env.OPENAI_API_KEY) {
  console.error('[FATAL] OPENAI_API_KEY missing.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

const defaultOrigins = 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173';
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins).split(',').map(s => s.trim()).filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin)) ? cb(null, true) : cb(null, false),
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '20kb' }));

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } });
const aiLimiter    = rateLimit({ windowMs: 10 * 60 * 1000, max: 20,  standardHeaders: true, legacyHeaders: false, message: { error: 'Rate limit reached. Please wait a few minutes.' } });

app.use(globalLimiter);

/* ── POST /api/analyze — single structured reflection ── */
app.post('/api/analyze', aiLimiter, async (req, res) => {
  const validation = validateThought(req.body?.thought);
  if (!validation.ok) return res.status(validation.status).json({ error: validation.error });

  try {
    const result = await performAnalyze(validation.thought, process.env.OPENAI_API_KEY);
    console.log(`[analyze] OK — tokens: ${result.tokensUsed ?? '?'}`);
    return res.json({ insight: result.insight, interpretation: result.interpretation, guidance: result.guidance });
  } catch (err) {
    const m = mapOpenAIError(err);
    return res.status(m.status).json({ error: m.error });
  }
});

/* ── POST /api/chat — conversational with memory ── */
app.post('/api/chat', aiLimiter, async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }
  if (messages.length > 80) {
    return res.status(400).json({ error: 'Too many messages. Please start a new session.' });
  }

  const valid = messages.every(m =>
    (m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string' &&
    m.content.trim().length > 0 &&
    m.content.length < 2000
  );
  if (!valid) return res.status(400).json({ error: 'Invalid message format.' });

  try {
    const result = await performChat(messages, process.env.OPENAI_API_KEY);
    console.log(`[chat] OK — tokens: ${result.tokensUsed ?? '?'}`);
    return res.json({ reply: result.reply });
  } catch (err) {
    const m = mapOpenAIError(err);
    return res.status(m.status).json({ error: m.error });
  }
});

/* ── GET /api/health ── */
app.get('/api/health', (req, res) => res.json({ status: 'ok', model: process.env.OPENAI_MODEL || 'gpt-4o' }));

app.listen(PORT, () => {
  console.log(`\n  CheckMyThoughts API — http://localhost:${PORT}\n  CORS: ${allowedOrigins.join(', ')}\n`);
});
