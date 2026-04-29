/**
 * CheckMyThoughts — API only (OpenAI + rate limits).
 * Deploy this `server` folder to Render / Railway / Fly.io / etc.
 * Set OPENAI_API_KEY and CORS_ORIGINS in the host's environment (not committed).
 */

require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { validateThought, performAnalyze, mapOpenAIError } = require('./lib/analyzeThought');

if (!process.env.OPENAI_API_KEY) {
  console.error('[FATAL] OPENAI_API_KEY is missing — add it in your host .env / dashboard.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

const defaultOrigins =
  'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173';
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false }));

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json({ limit: '10kb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Analysis limit reached. Please wait a few minutes before trying again.' },
});

app.use(globalLimiter);

app.post('/api/analyze', aiLimiter, async (req, res) => {
  const validation = validateThought(req.body?.thought);
  if (!validation.ok) {
    return res.status(validation.status).json({ error: validation.error });
  }

  try {
    const result = await performAnalyze(validation.thought, process.env.OPENAI_API_KEY);
    console.log(`[${new Date().toISOString()}] analyze OK — tokens: ${result.tokensUsed ?? '?'}`);
    return res.json({
      insight: result.insight,
      interpretation: result.interpretation,
      guidance: result.guidance,
    });
  } catch (err) {
    const mapped = mapOpenAIError(err);
    return res.status(mapped.status).json({ error: mapped.error });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CheckMyThoughts API',
    timestamp: new Date().toISOString(),
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('  CheckMyThoughts API — http://localhost:' + PORT);
  console.log('  Allowed CORS origins:', allowedOrigins.join(', ') || '(none)');
  console.log('');
});
