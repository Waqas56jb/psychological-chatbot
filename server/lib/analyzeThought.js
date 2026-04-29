const OpenAI = require('openai');
const SYSTEM_PROMPT = require('./systemPrompt');

function sanitizeInput(raw) {
  return String(raw)
    .replace(/<[^>]*>/g, '')
    .replace(/[^\S\r\n]+/g, ' ')
    .trim()
    .slice(0, 800);
}

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
  return markers.some((m) => lower.includes(m));
}

function validateThought(rawThought) {
  if (rawThought == null || typeof rawThought !== 'string') {
    return { ok: false, status: 400, error: 'A thought or feeling is required.' };
  }
  const thought = sanitizeInput(rawThought);
  if (thought.length < 5) {
    return {
      ok: false,
      status: 400,
      error: 'Please share a bit more so we can give you a meaningful reflection.',
    };
  }
  if (thought.length > 800) {
    return {
      ok: false,
      status: 400,
      error: 'Your thought is too long. Please keep it under 800 characters.',
    };
  }
  if (looksLikeInjection(thought)) {
    return {
      ok: false,
      status: 400,
      error:
        'Your input contains patterns that cannot be processed. Please share a genuine thought or feeling.',
    };
  }
  return { ok: true, thought };
}

async function performAnalyze(thought, apiKey) {
  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.72,
    max_tokens: 900,
    top_p: 0.92,
    frequency_penalty: 0.3,
    presence_penalty: 0.15,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here is the thought or feeling I want to explore:\n\n"${thought}"`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    const err = new Error('EMPTY');
    err.status = 500;
    err.publicMessage = 'The AI returned an empty response. Please try again.';
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const err = new Error('JSON');
    err.status = 500;
    err.publicMessage = 'Response formatting error. Please try again.';
    throw err;
  }

  const { insight, interpretation, guidance } = parsed;
  if (!insight || !interpretation || !guidance) {
    const err = new Error('INCOMPLETE');
    err.status = 500;
    err.publicMessage = 'Incomplete response from AI. Please try again.';
    throw err;
  }

  return {
    insight: String(insight).trim(),
    interpretation: String(interpretation).trim(),
    guidance: String(guidance).trim(),
    tokensUsed: completion.usage?.total_tokens,
  };
}

function mapOpenAIError(err) {
  if (err?.status === 429) {
    return { status: 429, error: 'The AI service is temporarily busy. Please try again in a moment.' };
  }
  if (err?.status === 401) {
    return { status: 500, error: 'Authentication error. Please contact support.' };
  }
  if (err?.status === 503 || err?.code === 'ECONNREFUSED') {
    return { status: 503, error: 'AI service is temporarily unavailable. Please try again shortly.' };
  }
  if (err.publicMessage) {
    return { status: err.status || 500, error: err.publicMessage };
  }
  return { status: 500, error: 'An unexpected error occurred. Please try again.' };
}

module.exports = {
  sanitizeInput,
  looksLikeInjection,
  validateThought,
  performAnalyze,
  mapOpenAIError,
};
