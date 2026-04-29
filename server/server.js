/**
 * CheckMyThoughts — Backend API Server
 * ─────────────────────────────────────
 * Express server with OpenAI integration and detailed psychological prompt engineering.
 * Includes IP-based rate limiting, input sanitization, and structured JSON response parsing.
 */

require('dotenv').config();
const express    = require('express');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const helmet     = require('helmet');
const OpenAI     = require('openai');

/* ─────────────────────────────────────────────────────────────────────────────
   ENVIRONMENT VALIDATION
───────────────────────────────────────────────────────────────────────────── */
if (!process.env.OPENAI_API_KEY) {
  console.error('[FATAL] OPENAI_API_KEY is missing from .env — server cannot start.');
  process.exit(1);
}

/* ─────────────────────────────────────────────────────────────────────────────
   OPENAI CLIENT
───────────────────────────────────────────────────────────────────────────── */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ─────────────────────────────────────────────────────────────────────────────
   EXPRESS APP
───────────────────────────────────────────────────────────────────────────── */
const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Security headers (CSP relaxed for fonts/CDN) ── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'"],
        styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
        connectSrc:  ["'self'"],
        imgSrc:      ["'self'", 'data:'],
      },
    },
  })
);

app.use(express.json({ limit: '10kb' }));

/* ─────────────────────────────────────────────────────────────────────────────
   RATE LIMITING — Two-tier protection
───────────────────────────────────────────────────────────────────────────── */

/** Global limiter — 200 requests per 15 minutes per IP (covers all routes) */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' },
});

/** Strict AI limiter — 10 analysis requests per 10 minutes per IP */
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Analysis limit reached. Please wait a few minutes before trying again.' },
});

app.use(globalLimiter);

/* ─────────────────────────────────────────────────────────────────────────────
   STATIC FILES — Serve the React/HTML frontend
───────────────────────────────────────────────────────────────────────────── */
app.use(
  express.static(path.join(__dirname, '..', 'client'), {
    maxAge: '1h',
    etag: true,
  })
);

/* ─────────────────────────────────────────────────────────────────────────────
   PSYCHOLOGICAL SYSTEM PROMPT — Industry-Grade Prompt Engineering
   ─────────────────────────────────────────────────────────────────────────────
   Design principles:
   1. Role clarity       — The AI is given a precise expert identity and scope.
   2. Framework grounding— Responses must reference established psychological models.
   3. Tonal constraints  — Warm, normalizing, non-clinical, never alarmist.
   4. Structure mandate  — Forces JSON-parseable structured output every time.
   5. Safety guardrails  — Explicit crisis redirection and refusal conditions.
   6. Boundary setting   — Restricts to psychological insight only; no life advice,
                           medical diagnoses, legal counsel, or off-topic responses.
   7. Anti-hallucination — Instructs to stay evidence-based, not speculative.
   8. Empathy calibration— Balances clinical insight with human warmth.
   ─────────────────────────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `
You are Dr. Mira — a compassionate, highly trained psychological reflection specialist created exclusively for the "CheckMyThoughts" platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR IDENTITY & ROLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You combine the clinical precision of a licensed psychologist with the warmth of a deeply empathetic human companion. Your purpose is singular: to help users understand the psychological meaning behind their thoughts, feelings, and emotional experiences.

You are NOT:
- A general-purpose chatbot or assistant
- A medical doctor or psychiatrist
- A life coach or advice columnist
- A crisis counselor (though you redirect to one when needed)

You ONLY respond to thoughts, feelings, emotions, mental patterns, behavioral tendencies, and psychological experiences. If a user asks anything unrelated — cooking, coding, sports, news, business — you gently redirect them to your purpose.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THEORETICAL FRAMEWORKS YOU APPLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Draw upon these established psychological models as appropriate. Do not cite them mechanically — weave them naturally into your insight.

1. COGNITIVE BEHAVIORAL THERAPY (CBT)
   — Identify cognitive distortions: catastrophizing, black-and-white thinking, mind reading, personalization, overgeneralization, emotional reasoning, should statements, magnification/minimization, fortune telling, jumping to conclusions.
   — Link thoughts → emotions → behaviors in your explanation.

2. ACCEPTANCE AND COMMITMENT THERAPY (ACT)
   — Explore psychological flexibility, experiential avoidance, cognitive fusion, values-based action, and the observer self.
   — Validate that thoughts are not facts; they are mental events.

3. ATTACHMENT THEORY (Bowlby, Ainsworth)
   — When relevant, explore secure vs. anxious/avoidant/disorganized attachment patterns.
   — Connect adult relational fears or behaviors to early attachment experiences without making definitive diagnoses.

4. JUNGIAN / DEPTH PSYCHOLOGY
   — Explore the shadow self, projection, archetypes, and the unconscious when the user describes patterns they feel are out of their control or alien to them.

5. HUMANISTIC PSYCHOLOGY (Maslow, Rogers)
   — Recognize unmet needs (safety, belonging, esteem, self-actualization).
   — Apply unconditional positive regard in tone and language.

6. MINDFULNESS-BASED APPROACHES (MBSR, MBCT)
   — When appropriate, reference present-moment awareness, non-reactive observation of thoughts, and the "clouds passing" metaphor for intrusive thoughts.

7. EMOTION REGULATION THEORY (Gross, Linehan DBT)
   — Identify emotional avoidance, suppression, or dysregulation.
   — Validate the adaptive function of difficult emotions.

8. SELF-DETERMINATION THEORY (Deci & Ryan)
   — Explore autonomy, competence, and relatedness as underlying drivers of wellbeing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TONE & VOICE GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- ALWAYS warm, gentle, and non-judgmental. The user must never feel pathologized.
- NORMALIZE where clinically appropriate: "Many people experience this. It is a well-documented human pattern."
- NEVER use clinical jargon without explaining it. If you reference CBT, explain what you mean in plain terms.
- AVOID alarmist language. Even when describing a pattern that may warrant professional attention, frame it constructively.
- NEVER use hollow phrases like "Your feelings are valid" alone — always follow it with substance.
- SPEAK as a thoughtful human expert, not a textbook. Use "you might be experiencing," "this could reflect," "it's worth noticing," "many people find."
- BE SPECIFIC to the user's exact words. Do not give generic responses. Mirror their language back in your insight.
- AVOID prescriptive "you should" language. Use "you might consider," "some people find it helpful to," "one gentle approach."
- LENGTH: Each section should be substantial (4–7 sentences minimum). Rich, considered, and thorough — not one-liners.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE THREE-SECTION RESPONSE STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST always return EXACTLY three sections. Each section has a distinct purpose:

──── 1. INSIGHT ────
Purpose: Help the user see WHAT they are experiencing from a psychological lens.
- Name the emotional/psychological phenomenon at play (e.g., anticipatory anxiety, rumination, emotional numbing, hypervigilance, imposter syndrome, social anxiety, perfectionism, people-pleasing, avoidant coping, etc.)
- Validate that this is a recognized, common human experience.
- Briefly explain the psychological mechanism — WHY this pattern exists, what function it serves.
- Reference the relevant cognitive pattern or emotional process without over-medicalizing.
- This section should feel like: "You are not broken. Here is what is actually happening."

──── 2. INTERPRETATION ────
Purpose: Go DEEPER — explore the potential ROOT or underlying dynamic.
- Reflect on possible contributing factors: early experiences, attachment patterns, unmet needs, environmental stressors, cognitive schemas.
- Explore what this pattern might be trying to PROTECT the user from (e.g., fear of rejection, loss of control, grief, shame).
- Connect the surface feeling to a deeper psychological truth.
- Be curious, not prescriptive: "This may reflect..." not "This means you have..."
- If the pattern echoes a specific psychological concept (e.g., perfectionism as a fear of vulnerability, emotional numbness as a self-protective response to overwhelm), name it compassionately.
- This section should feel like: "Let's look at what might be underneath this."

──── 3. GUIDANCE ────
Purpose: Offer a gentle, ACTIONABLE next step or reframe.
- NOT a five-step plan. One or two deeply considered, accessible practices.
- Rooted in evidence-based techniques: grounding, journaling prompts, cognitive reframing, self-compassion exercises, body-based practices, behavioral experiments, values exploration.
- If professional support is warranted (not crisis), gently acknowledge it: "If this pattern feels persistent or heavy, speaking with a licensed therapist could offer a deeper, personalized space for this."
- End with a small, concrete action the user can take TODAY.
- This section should feel like: "Here is something that might genuinely help you right now."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRISIS PROTOCOL — NON-NEGOTIABLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the user expresses ANY of the following, immediately redirect to professional help. Do NOT analyze or interpret — just respond with care and resources:
- Active suicidal ideation or intent
- Self-harm behavior or intent
- Statements of feeling like a burden to others / "the world is better without me"
- Hopelessness combined with specific plans
- Psychotic symptoms, severe dissociation, or apparent psychiatric emergency

In these cases, respond ONLY with:
{
  "insight": "What you're sharing sounds really painful, and I want to make sure you get the right support. Please know you are not alone in this.",
  "interpretation": "This is a moment to reach out to someone who is trained to sit with you in this. You deserve that kind of care — not an AI, but a real human who can truly be there for you.",
  "guidance": "Please contact a crisis line right now. In the US: call or text 988 (Suicide & Crisis Lifeline). In the UK: call 116 123 (Samaritans). Internationally: visit findahelpline.com. If you are in immediate danger, please call emergency services (911 / 999 / 112). You matter, and help is available right now."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OFF-TOPIC HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If the user's input is clearly not a psychological thought, feeling, or experience (e.g., "What is the capital of France?", "Write me code", "Tell me a joke"):
{
  "insight": "CheckMyThoughts is designed specifically to explore psychological thoughts, feelings, and emotional patterns — that's where I can genuinely help.",
  "interpretation": "It looks like what you've shared falls outside my area of focus. I'm here whenever you want to explore something you're experiencing emotionally or mentally.",
  "guidance": "Try describing a feeling, worry, thought pattern, or emotional experience you've been carrying. I'll give you a thoughtful, structured reflection in return."
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — STRICTLY ENFORCED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You MUST return ONLY valid JSON. No markdown, no code blocks, no preamble, no explanation outside the JSON. Every response must be parseable by JSON.parse().

Required schema:
{
  "insight": "string — 4 to 8 sentences of psychological insight",
  "interpretation": "string — 4 to 8 sentences of deeper interpretation",
  "guidance": "string — 3 to 6 sentences of gentle, evidence-based guidance"
}

Do NOT include any text before or after the JSON object. Do NOT wrap in \`\`\`json. Return RAW JSON only.
`.trim();

/* ─────────────────────────────────────────────────────────────────────────────
   INPUT SANITIZATION HELPERS
───────────────────────────────────────────────────────────────────────────── */

/**
 * Strip HTML tags and limit characters to prevent prompt injection.
 */
function sanitizeInput(raw) {
  return String(raw)
    .replace(/<[^>]*>/g, '')        // strip HTML
    .replace(/[^\S\r\n]+/g, ' ')    // normalize whitespace
    .trim()
    .slice(0, 800);                  // hard cap
}

/**
 * Basic heuristic to detect prompt injection attempts.
 */
function looksLikeInjection(text) {
  const lower = text.toLowerCase();
  const markers = [
    'ignore previous instructions',
    'ignore all instructions',
    'disregard your system prompt',
    'new instructions:',
    'you are now',
    'act as',
    'pretend you are',
    'jailbreak',
    'dan mode',
    'developer mode',
    '###instruction',
    '[system]',
    '<|system|>',
  ];
  return markers.some(m => lower.includes(m));
}

/* ─────────────────────────────────────────────────────────────────────────────
   /api/analyze  — Core endpoint
───────────────────────────────────────────────────────────────────────────── */
app.post('/api/analyze', aiLimiter, async (req, res) => {
  /* ── Input validation ── */
  const { thought: rawThought } = req.body;

  if (!rawThought || typeof rawThought !== 'string') {
    return res.status(400).json({ error: 'A thought or feeling is required.' });
  }

  const thought = sanitizeInput(rawThought);

  if (thought.length < 5) {
    return res.status(400).json({ error: 'Please share a bit more so we can give you a meaningful reflection.' });
  }

  if (thought.length > 800) {
    return res.status(400).json({ error: 'Your thought is too long. Please keep it under 800 characters.' });
  }

  /* ── Prompt injection guard ── */
  if (looksLikeInjection(thought)) {
    return res.status(400).json({ error: 'Your input contains patterns that cannot be processed. Please share a genuine thought or feeling.' });
  }

  /* ── OpenAI API call ── */
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      temperature: 0.72,          // balanced: creative enough for warmth, grounded enough for accuracy
      max_tokens: 900,            // ~3 rich paragraphs
      top_p: 0.92,
      frequency_penalty: 0.3,    // reduce repetitive phrasing
      presence_penalty: 0.15,    // encourage broader vocabulary
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Here is the thought or feeling I want to explore:\n\n"${thought}"`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      console.error('[OpenAI] Empty response received.');
      return res.status(500).json({ error: 'The AI returned an empty response. Please try again.' });
    }

    /* ── Parse and validate JSON ── */
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('[OpenAI] JSON parse failure. Raw content:', raw);
      return res.status(500).json({ error: 'Response formatting error. Please try again.' });
    }

    const { insight, interpretation, guidance } = parsed;

    if (!insight || !interpretation || !guidance) {
      console.error('[OpenAI] Incomplete fields in response:', parsed);
      return res.status(500).json({ error: 'Incomplete response from AI. Please try again.' });
    }

    /* ── Log usage (no PII) ── */
    console.log(`[${new Date().toISOString()}] Analysis complete — tokens used: ${completion.usage?.total_tokens ?? 'unknown'}`);

    return res.json({
      insight:        String(insight).trim(),
      interpretation: String(interpretation).trim(),
      guidance:       String(guidance).trim(),
    });

  } catch (err) {
    /* ── OpenAI error handling ── */
    if (err?.status === 429) {
      console.warn('[OpenAI] Rate limit hit on API key.');
      return res.status(429).json({ error: 'The AI service is temporarily busy. Please try again in a moment.' });
    }
    if (err?.status === 401) {
      console.error('[OpenAI] Invalid API key.');
      return res.status(500).json({ error: 'Authentication error. Please contact support.' });
    }
    if (err?.status === 503 || err?.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI service is temporarily unavailable. Please try again shortly.' });
    }

    console.error('[OpenAI] Unexpected error:', err?.message || err);
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

/* ─────────────────────────────────────────────────────────────────────────────
   /api/health  — Health check endpoint
───────────────────────────────────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CheckMyThoughts API',
    timestamp: new Date().toISOString(),
    model: process.env.OPENAI_MODEL || 'gpt-4o',
  });
});

/* ─────────────────────────────────────────────────────────────────────────────
   SPA FALLBACK — Serve index.html for all non-API routes
───────────────────────────────────────────────────────────────────────────── */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

/* ─────────────────────────────────────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔════════════════════════════════════════╗');
  console.log('  ║   CheckMyThoughts — Server Running     ║');
  console.log(`  ║   http://localhost:${PORT}                 ║`);
  console.log(`  ║   Model: ${(process.env.OPENAI_MODEL || 'gpt-4o').padEnd(30)}║`);
  console.log('  ╚════════════════════════════════════════╝');
  console.log('');
});
