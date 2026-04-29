import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analyzeUrl } from './api.js';

const RATE_KEY = 'cmt_react_v1';
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_CHARS = 800;

const CHIPS = [
  { text: '🌀 I overthink everything', variant: 'violet', fill: 'I overthink everything constantly, my mind never rests and I cannot seem to stop analyzing every small detail.' },
  { text: '🕯️ I feel emotionally numb', variant: 'teal', fill: 'I feel emotionally numb or empty inside, like I can observe my life but not really feel it.' },
  { text: '😰 I worry constantly', variant: 'rose', fill: 'I worry constantly about things that probably will not happen, but I cannot stop the anxious thoughts.' },
  { text: '🌿 I do not belong', variant: 'amber', fill: 'I feel like I do not truly belong anywhere — even around people who care about me, I feel like an outsider.' },
  { text: '⚡ Intrusive thoughts', variant: 'sky', fill: 'I cannot stop having intrusive negative thoughts, no matter how hard I try to push them away.' },
  { text: '🎭 I perform being okay', variant: 'emerald', fill: 'I feel like I have to perform or pretend to be okay all the time, even when I am exhausted inside.' },
  { text: '💔 Fear of abandonment', variant: 'violet', fill: 'I have a deep fear of being abandoned by the people I love, even when they show no signs of leaving.' },
  { text: '😔 Unexplained guilt', variant: 'rose', fill: 'I feel guilty even when I have not done anything wrong — I constantly second-guess my actions.' },
  { text: '🏋️ I cannot ask for help', variant: 'teal', fill: 'I find it very hard to ask for help; I always feel like I should be able to handle everything alone.' },
];

const FRAMEWORKS = [
  { emoji: '🧠', title: 'CBT', sub: 'Thoughts, emotions, and behaviors — including common cognitive distortions.' },
  { emoji: '🌊', title: 'ACT', sub: 'Psychological flexibility, values, and defusion from difficult thoughts.' },
  { emoji: '💞', title: 'Attachment', sub: 'How bonds and safety needs shape adult emotional patterns.' },
  { emoji: '🔮', title: 'Depth', sub: 'Shadow, projection, and meaning beneath surface symptoms.' },
  { emoji: '🌱', title: 'Humanistic', sub: 'Needs, self-concept, and unconditional positive regard.' },
  { emoji: '🧘', title: 'Mindfulness', sub: 'Present-moment awareness and gentle observation of the mind.' },
];

const TESTIMONIALS = [
  { text: 'The interpretation connected dots I had not named. It felt specific to my words, not generic.' },
  { text: 'Guidance gave me one small thing to try. That is what I needed at 2am.' },
  { text: 'It explained why I might feel this way without making me feel broken.' },
  { text: 'I shared the output with my therapist — she said it aligned with themes we had been exploring.' },
];

function useClientRateLimit() {
  const check = useCallback(() => {
    const now = Date.now();
    let log = [];
    try {
      log = JSON.parse(sessionStorage.getItem(RATE_KEY) || '[]');
    } catch {
      log = [];
    }
    log = log.filter((t) => now - t < RATE_WINDOW_MS);
    sessionStorage.setItem(RATE_KEY, JSON.stringify(log));
    return log.length >= RATE_LIMIT;
  }, []);

  const logHit = useCallback(() => {
    const now = Date.now();
    let log = [];
    try {
      log = JSON.parse(sessionStorage.getItem(RATE_KEY) || '[]');
    } catch {
      log = [];
    }
    log.push(now);
    sessionStorage.setItem(RATE_KEY, JSON.stringify(log));
  }, []);

  return { check, logHit };
}

export default function App() {
  const [thought, setThought] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [result, setResult] = useState(null);
  const [copyOk, setCopyOk] = useState(false);
  const [loaderLine, setLoaderLine] = useState(0);
  const loaderTimer = useRef(null);
  const { check: isClientLimited, logHit } = useClientRateLimit();

  const charCount = thought.length;

  useEffect(() => {
    if (!loading) {
      if (loaderTimer.current) clearInterval(loaderTimer.current);
      setLoaderLine(0);
      return;
    }
    loaderTimer.current = setInterval(() => {
      setLoaderLine((n) => (n + 1) % 3);
    }, 2200);
    return () => {
      if (loaderTimer.current) clearInterval(loaderTimer.current);
    };
  }, [loading]);

  const loaderMessages = useMemo(
    () => ['Reflecting on your thought…', 'Applying psychological frameworks…', 'Crafting compassionate insight…'],
    []
  );

  const analyze = useCallback(async () => {
    const t = thought.trim();
    setError('');
    setRateLimited(false);

    if (!t) {
      setError('Please share a thought or feeling before analysing.');
      return;
    }
    if (t.length < 10) {
      setError('Write a little more — deeper words reveal richer insights.');
      return;
    }
    if (isClientLimited()) {
      setRateLimited(true);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(analyzeUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thought: t }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      logHit();
      setResult({
        insight: data.insight || '',
        interpretation: data.interpretation || '',
        guidance: data.guidance || '',
      });
    } catch (e) {
      setError(e.message || 'Unable to connect. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }, [thought, isClientLimited, logHit]);

  const clearAll = useCallback(() => {
    setThought('');
    setResult(null);
    setError('');
    setRateLimited(false);
  }, []);

  const copyAll = useCallback(async () => {
    if (!result) return;
    const text = [
      '💡 PSYCHOLOGICAL INSIGHT',
      result.insight,
      '',
      '🔍 INTERPRETATION',
      result.interpretation,
      '',
      '✨ GENTLE GUIDANCE',
      result.guidance,
      '',
      '— CheckMyThoughts | Reflective AI',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2400);
    } catch {
      window.alert('Could not copy — select text manually.');
    }
  }, [result]);

  const share = useCallback(async () => {
    if (!result) return;
    const preview = result.insight.slice(0, 140);
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My reflection — CheckMyThoughts',
          text: `💡 ${preview}…`,
          url: window.location.href,
        });
      } catch {
        /* dismissed */
      }
    } else {
      copyAll();
    }
  }, [result, copyAll]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyze();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [analyze]);

  return (
    <>
      <div className="mesh" aria-hidden>
        <div className="mesh-mid" />
      </div>
      <div className="noise" aria-hidden />

      <div className="app">
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-logo" aria-hidden>
              🧠
            </div>
            <span className="nav-title">CheckMyThoughts</span>
          </div>
          <span className="nav-badge">Reflective AI</span>
        </nav>

        <header className="hero">
          <div className="hero-pill">
            <span className="dot" />
            AI-powered psychological insight
          </div>
          <h1>
            <span className="hero-line1">Is what I am feeling</span>
            <span className="hero-line2">actually normal?</span>
          </h1>
          <p className="hero-desc">
            Share a thought, fear, or feeling. Receive structured reflection — insight, interpretation, and gentle
            guidance — grounded in evidence-based psychological frameworks.
          </p>
        </header>

        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">1</div>
            <div className="how-label">Share your thought</div>
            <div className="how-sub">Type freely — no account, no storage, no judgment.</div>
          </div>
          <div className="how-card">
            <div className="how-num">2</div>
            <div className="how-label">AI reflects deeply</div>
            <div className="how-sub">Structured analysis using CBT, ACT, attachment, and more.</div>
          </div>
          <div className="how-card">
            <div className="how-num">3</div>
            <div className="how-label">Receive insight</div>
            <div className="how-sub">Copy or share your reflection in one tap.</div>
          </div>
        </div>

        <div className="chips-block">
          <div className="chips-label">Quick prompts</div>
          <div className="chips-wrap">
            {CHIPS.map((c) => (
              <button
                key={c.text}
                type="button"
                className={`chip chip-${c.variant}`}
                onClick={() => setThought(c.fill)}
              >
                {c.text}
              </button>
            ))}
          </div>
        </div>

        <section className="main-card" aria-labelledby="input-heading">
          <div id="input-heading" className="card-label">
            Your thought or feeling
          </div>
          <textarea
            className="thought-input"
            value={thought}
            onChange={(e) => setThought(e.target.value.slice(0, MAX_CHARS))}
            maxLength={MAX_CHARS}
            placeholder="e.g. I always feel like something bad is about to happen even when everything is fine. It is exhausting…"
            rows={6}
            spellCheck
          />
          <div className="char-row">
            <span>Ctrl + Enter to analyse</span>
            <span>
              {charCount} / {MAX_CHARS}
            </span>
          </div>

          <div className="btn-row">
            <button type="button" className="btn-analyze" disabled={loading} onClick={analyze}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analyse my thought
            </button>
            <button type="button" className="btn-clear" onClick={clearAll}>
              Clear
            </button>
          </div>

          <div className="privacy-row">
            <span aria-hidden>🔐</span>
            <span>Your thoughts are never stored. Anonymous session only.</span>
          </div>

          <div className={`banner banner-warn ${rateLimited ? 'show' : ''}`}>
            You have reached the limit for now. Please wait a moment before trying again.
          </div>
          <div className={`banner banner-err ${error ? 'show' : ''}`}>{error}</div>

          <div className={`loader ${loading ? 'show' : ''}`} aria-live="polite">
            <div className="loader-ring" />
            <div className="loader-msg">{loaderMessages[loaderLine]}</div>
          </div>

          <div className={`response ${result ? 'show' : ''}`}>
            <div className="response-head">
              <div className="response-title">Psychological reflection</div>
              <div className="action-row">
                <button type="button" className={`btn-sm ${copyOk ? 'success' : ''}`} onClick={copyAll}>
                  {copyOk ? '✓ Copied' : '📋 Copy'}
                </button>
                <button type="button" className="btn-sm" onClick={share}>
                  🔗 Share
                </button>
              </div>
            </div>

            <article className="r-section r-insight">
              <div className="r-bar" aria-hidden />
              <div className="r-tag">💡 Psychological insight</div>
              <div className="r-text">{result?.insight}</div>
            </article>
            <article className="r-section r-interpret">
              <div className="r-bar" aria-hidden />
              <div className="r-tag">🔍 Interpretation</div>
              <div className="r-text">{result?.interpretation}</div>
            </article>
            <article className="r-section r-guidance">
              <div className="r-bar" aria-hidden />
              <div className="r-tag">✨ Gentle guidance</div>
              <div className="r-text">{result?.guidance}</div>
            </article>
          </div>
        </section>

        <section className="section" aria-labelledby="feat-heading">
          <div className="section-head">
            <p className="eyebrow v" id="feat-heading">
              Evidence-based
            </p>
            <h2>What makes this different</h2>
            <p className="section-sub">
              Structured psychological reflection — not casual chat. Every response follows insight, interpretation, and
              guidance.
            </p>
          </div>
          <div className="features-grid">
            <div className="feat-card">
              <div className="feat-icon v">🧩</div>
              <h3>CBT-informed</h3>
              <p>Thought patterns, cognitive distortions, and the link between thoughts, feelings, and behaviour.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon t">🌿</div>
              <h3>Compassionate tone</h3>
              <p>Warm, normalising language — you are never pathologised for being human.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon a">🔐</div>
              <h3>Fully anonymous</h3>
              <p>No accounts, no databases of your words. This page is a private mirror.</p>
            </div>
            <div className="feat-card">
              <div className="feat-icon ro">⚡</div>
              <h3>Structured output</h3>
              <p>Three clear layers so you always know what you are reading and why it matters.</p>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="fw-heading">
          <div className="section-head">
            <p className="eyebrow t" id="fw-heading">
              Theoretical foundations
            </p>
            <h2>Informed by real psychology</h2>
            <p className="section-sub">The model is guided to draw from established therapeutic lenses where they fit your words.</p>
          </div>
          <div className="fw-grid">
            {FRAMEWORKS.map((f) => (
              <div key={f.title} className="fw-card">
                <span style={{ fontSize: '1.35rem', display: 'block', marginBottom: 6 }}>{f.emoji}</span>
                <strong>{f.title}</strong>
                {f.sub}
              </div>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="test-heading">
          <div className="section-head">
            <p className="eyebrow r" id="test-heading">
              Voices like yours
            </p>
            <h2>You are not alone in this</h2>
          </div>
          <div className="testimonials">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="t-card">
                <div className="t-quote" aria-hidden>
                  &ldquo;
                </div>
                <p className="t-text">{t.text}</p>
                <div className="t-author">Anonymous</div>
              </div>
            ))}
          </div>
        </section>

        <section className="stats-card" aria-labelledby="stats-heading">
          <div className="section-head" style={{ marginBottom: 'clamp(24px,5vw,36px)' }}>
            <p className="eyebrow v" id="stats-heading">
              By the numbers
            </p>
            <h2>A space that holds you</h2>
          </div>
          <div className="stats-grid">
            <div>
              <div className="stat-num">100%</div>
              <div className="stat-label">Anonymous — no thought storage</div>
            </div>
            <div>
              <div className="stat-num">3</div>
              <div className="stat-label">Reflection layers per response</div>
            </div>
            <div>
              <div className="stat-num">6+</div>
              <div className="stat-label">Psychological lenses in the prompt</div>
            </div>
          </div>
        </section>

        <aside className="disclaimer">
          <span className="disclaimer-icon" aria-hidden>
            ⚠️
          </span>
          <p>
            <strong style={{ color: '#fda4af' }}>Important:</strong> CheckMyThoughts is an AI tool — not therapy, diagnosis,
            or crisis care. If you are in distress, contact a licensed professional or crisis line. US:{' '}
            <a href="tel:988">988</a>. UK: <a href="https://www.samaritans.org">Samaritans</a> 116 123.
          </p>
        </aside>

        <footer>
          <div className="footer-brand">
            <div className="footer-logo">🧠</div>
            <span className="footer-name">CheckMyThoughts</span>
          </div>
          <p className="footer-tag">Reflective AI for self-understanding — not a replacement for professional mental health care.</p>
          <div className="footer-links">
            <a href="#root">Top</a>
            <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">
              Helplines
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
