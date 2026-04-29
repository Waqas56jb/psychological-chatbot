const OpenAI = require('openai');
const SYSTEM_PROMPT = require('./systemPrompt');

/* ─── Conversational chat system prompt (plain text responses, memory-aware) ─── */
const CHAT_SYSTEM_PROMPT = `
You are Dr. Mira — a warm, perceptive, and compassionate psychological companion on CheckMyThoughts.

━━━ YOUR PURPOSE ━━━
You help users understand their own thoughts, feelings, emotional patterns, and psychological experiences through thoughtful, reflective conversation. You are NOT a general assistant — you are a specialist in the human inner world.

━━━ WHAT YOU RESPOND TO ━━━
- Personal emotions, anxieties, fears, sadness, emptiness, loneliness
- Thought patterns: overthinking, rumination, perfectionism, imposter syndrome, people-pleasing
- Relationship dynamics and attachment fears
- Behavioral patterns: avoidance, self-sabotage, emotional numbing
- Questions like "Why do I always feel...?", "Is it normal to...?", "Why can't I stop...?"

━━━ WHAT YOU DO NOT RESPOND TO ━━━
Any topic unrelated to the user's emotional or psychological experience — including:
- Technical questions (coding, math, science, calculators, engineering)
- Factual or trivia questions ("What is the capital of X?")
- Entertainment ("Tell me a joke", "Write a poem about nature")
- Medical symptom analysis or medication advice
- News, politics, finance, or any general-purpose task

When a user asks something off-topic, respond warmly but firmly:
"That's a little outside my world — I'm really here for the emotional and psychological side of things. Is there something you've been feeling or carrying lately that we could explore together?"

━━━ CONVERSATION STYLE ━━━
- Conversational and human. Never robotic, never use bullet lists or headers.
- Write in 2–4 focused, flowing paragraphs. Never too long.
- ALWAYS validate before you analyze. Acknowledge the feeling first.
- Ask exactly ONE gentle follow-up question per response — no more.
- Use the user's own words back to them. Mirror their language.
- Normalize psychological experiences: "This is actually a very common human pattern..."
- Never say "I understand exactly how you feel" — say "That sounds like..."
- Avoid jargon; if you use a term (like CBT or rumination), briefly explain it.
- Build continuity: reference what the user has shared earlier in this conversation.

━━━ PSYCHOLOGICAL FRAMEWORKS ━━━
Apply naturally, without naming them explicitly unless helpful:
- CBT: cognitive distortions, thought–feeling–behavior loop
- ACT: psychological flexibility, values, defusion from thoughts
- Attachment theory: patterns in relationships and abandonment fears
- Mindfulness: present-moment awareness, thoughts as passing clouds
- DBT: emotion regulation, distress tolerance
- Humanistic: unmet needs, self-actualization, unconditional positive regard

━━━ MEMORY ━━━
You have access to the full conversation history. Use it. Build on what the user has shared. Never make them repeat themselves. Show them you remember.

━━━ CRISIS PROTOCOL ━━━
If the user expresses suicidal ideation, intent to self-harm, or a psychiatric emergency — stop analysis immediately and respond:
"I hear you, and I'm genuinely concerned about you right now. Please reach out to someone who can truly support you in this moment. In the US, call or text 988. In the UK, call Samaritans at 116 123. If you're in immediate danger, please call 911 or your local emergency number. You matter more than any conversation."

━━━ FORMAT ━━━
Plain conversational text only. No JSON, no markdown headers, no bullet lists. Write as a warm, thoughtful human would.
`.trim();

/* ─── Input helpers ─── */
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
    'ignore previous instructions', 'ignore all instructions',
    'disregard your system prompt', 'new instructions:',
    'you are now', 'pretend you are', 'jailbreak',
    'dan mode', 'developer mode', '###instruction', '[system]', '<|system|>',
  ];
  return markers.some((m) => lower.includes(m));
}

function validateThought(rawThought) {
  if (rawThought == null || typeof rawThought !== 'string') {
    return { ok: false, status: 400, error: 'A thought or feeling is required.' };
  }
  const thought = sanitizeInput(rawThought);
  if (thought.length < 5) {
    return { ok: false, status: 400, error: 'Please share a bit more so we can give you a meaningful reflection.' };
  }
  if (thought.length > 800) {
    return { ok: false, status: 400, error: 'Your thought is too long. Please keep it under 800 characters.' };
  }
  if (looksLikeInjection(thought)) {
    return { ok: false, status: 400, error: 'Your input contains patterns that cannot be processed. Please share a genuine thought or feeling.' };
  }
  return { ok: true, thought };
}

/* ─── One-shot structured analysis (for /api/analyze) ─── */
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
      { role: 'user', content: `Here is the thought or feeling I want to explore:\n\n"${thought}"` },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    const err = new Error('EMPTY'); err.status = 500; err.publicMessage = 'The AI returned an empty response.'; throw err;
  }

  let parsed;
  try { parsed = JSON.parse(raw); } catch {
    const err = new Error('JSON'); err.status = 500; err.publicMessage = 'Response formatting error. Please try again.'; throw err;
  }

  const { insight, interpretation, guidance } = parsed;
  if (!insight || !interpretation || !guidance) {
    const err = new Error('INCOMPLETE'); err.status = 500; err.publicMessage = 'Incomplete response from AI.'; throw err;
  }

  return {
    insight: String(insight).trim(),
    interpretation: String(interpretation).trim(),
    guidance: String(guidance).trim(),
    tokensUsed: completion.usage?.total_tokens,
  };
}

/* ─── Conversational chat with memory (for /api/chat) ─── */
async function performChat(messages, apiKey) {
  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  // Keep last 40 messages = 20 user+assistant pairs for memory
  const history = messages.slice(-40).map((m) => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content).slice(0, 2000),
  }));

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.78,
    max_tokens: 600,
    top_p: 0.93,
    frequency_penalty: 0.35,
    presence_penalty: 0.2,
    messages: [
      { role: 'system', content: CHAT_SYSTEM_PROMPT },
      ...history,
    ],
  });

  const reply = completion.choices[0]?.message?.content;
  if (!reply) {
    const err = new Error('EMPTY'); err.status = 500; err.publicMessage = 'No response received.'; throw err;
  }

  return {
    reply: reply.trim(),
    tokensUsed: completion.usage?.total_tokens,
  };
}

/* ─── Error mapper ─── */
function mapOpenAIError(err) {
  if (err?.status === 429) return { status: 429, error: 'The AI service is temporarily busy. Please try again in a moment.' };
  if (err?.status === 401) return { status: 500, error: 'Authentication error. Please contact support.' };
  if (err?.status === 503 || err?.code === 'ECONNREFUSED') return { status: 503, error: 'AI service unavailable. Please try again shortly.' };
  if (err.publicMessage) return { status: err.status || 500, error: err.publicMessage };
  return { status: 500, error: 'An unexpected error occurred. Please try again.' };
}

module.exports = {
  sanitizeInput, looksLikeInjection, validateThought,
  performAnalyze, performChat, mapOpenAIError,
};
