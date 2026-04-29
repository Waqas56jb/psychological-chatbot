import { useEffect } from 'react';
import './Landing.css';

/* ── Scroll reveal hook ── */
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

const FRAMEWORKS = [
  { emoji: '🧠', name: 'CBT', sub: 'Cognitive Behavioral Therapy — your thoughts shape your reality' },
  { emoji: '🌊', name: 'ACT', sub: 'Acceptance & Commitment — defuse from thoughts, act on values' },
  { emoji: '💞', name: 'Attachment', sub: 'Bowlby & Ainsworth — early bonds shape adult patterns' },
  { emoji: '🔮', name: 'Depth', sub: 'Jungian — shadow, archetypes, and the unconscious mind' },
  { emoji: '🌱', name: 'Humanistic', sub: 'Maslow & Rogers — unmet needs and positive regard' },
  { emoji: '🧘', name: 'Mindfulness', sub: 'MBSR — present-moment awareness and non-judgment' },
];

const TESTIMONIALS = [
  { text: 'The interpretation connected dots I had not been able to name for years. It felt specific to my exact words.' },
  { text: 'At 2am with nowhere to turn, the guidance gave me one small thing to try. That was everything.' },
  { text: "It didn't just say \"your feelings are valid\" — it actually explained why I might feel this way." },
  { text: 'I shared it with my therapist. She was genuinely impressed by how closely it matched what we had been exploring.' },
];

export default function Landing({ onStart }) {
  useScrollReveal();

  return (
    <div className="landing">
      {/* ── Animated BG ── */}
      <div className="l-bg" aria-hidden>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
      </div>
      <div className="noise" aria-hidden />

      {/* ── Nav ── */}
      <nav className="l-nav">
        <div className="l-nav-inner">
          <a href="#" className="l-nav-brand">
            <div className="l-nav-logo">🧠</div>
            <span className="l-nav-name">CheckMyThoughts</span>
          </a>
          <div className="l-nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#psychology">Psychology</a>
          </div>
          <button className="l-nav-cta" onClick={onStart}>Start Reflecting</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="l-hero" id="home">
        <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '0 clamp(20px,5vw,48px)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="l-hero-badge">
            <span className="pulse" />
            AI Psychological Reflection · Evidence-Based
          </div>

          <h1>
            <span className="l-hero-line1">Is what I'm feeling</span>
            <span className="l-hero-line2">actually normal?</span>
          </h1>

          <p className="l-hero-desc">
            Share a thought, fear, or pattern. Receive warm, structured psychological
            insight — grounded in CBT, ACT, attachment theory, and mindfulness.
            Private. Anonymous. Always compassionate.
          </p>

          <div className="l-hero-actions">
            <button className="btn-hero-primary" onClick={onStart}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Talk to Dr. Mira
            </button>
            <button className="btn-hero-outline" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>
              See how it works
            </button>
          </div>

          {/* floating preview card */}
          <div className="l-preview-card">
            <div className="pc-header">
              <div className="pc-avatar">🧠</div>
              <div className="pc-meta">
                <strong>Dr. Mira</strong>
                <span>● Online · Reflecting with you</span>
              </div>
            </div>

            <div className="pc-msg user">
              <div className="pc-bubble">
                I feel like I'm not good enough no matter what I achieve.
              </div>
            </div>

            <div className="pc-msg ai">
              <div className="pc-ava">🧠</div>
              <div className="pc-bubble">
                What you're describing is actually a well-documented pattern called the "never enough" cycle — common in high achievers. No matter how much you do, the goalposts move. It isn't a character flaw...
              </div>
            </div>

            <div className="pc-typing">
              <div className="pc-ava">🧠</div>
              <div className="dots"><span /><span /><span /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <div className="l-trust">
        <div className="trust-inner">
          <span className="trust-label">Built on</span>
          {['🧠 CBT', '🌊 ACT', '💞 Attachment Theory', '🧘 Mindfulness', '🔮 Depth Psychology'].map((t) => (
            <div key={t} className="trust-tag"><span className="t-emoji">{t.split(' ')[0]}</span> {t.split(' ').slice(1).join(' ')}</div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <section className="l-section" id="how">
        <div className="l-wrap">
          <div className="l-section-head reveal">
            <span className="l-eyebrow ey-v">Simple & Intentional</span>
            <h2>How it works</h2>
            <p className="l-section-sub">Three moments — from sharing to understanding.</p>
          </div>
          <div className="how-grid">
              {[
              { n: '01', title: 'Share freely', desc: "Type whatever you're feeling — a worry, a pattern, a fear. No accounts, no tracking, no judgment. Just your words.", delay: 0 },
              { n: '02', title: 'AI reflects', desc: "Dr. Mira listens across your full conversation, drawing on 6+ psychological frameworks to understand what you're experiencing.", delay: 1 },
              { n: '03', title: 'Receive insight', desc: 'Get compassionate, specific insight — not generic phrases. Understand the why behind what you feel, and one small step forward.', delay: 2 },
            ].map((s) => (
              <div key={s.n} className={`how-step reveal reveal-delay-${s.delay}`}>
                <div className="how-num">{s.n}</div>
                <div className="how-title">{s.title}</div>
                <div className="how-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="l-section features-bg" id="features">
        <div className="l-wrap">
          <div className="l-section-head reveal">
            <span className="l-eyebrow ey-t">Evidence-Based</span>
            <h2>What makes this different</h2>
            <p className="l-section-sub">Real psychological depth — not a generic chatbot.</p>
          </div>
          <div className="features-grid">
            {[
              { icon: '🧩', cls: 'fi-v', h: 'Real conversation memory', p: 'Dr. Mira remembers your last 20 exchanges — she builds on what you share instead of asking you to repeat yourself.' },
              { icon: '🌿', cls: 'fi-t', h: 'Compassionate, not clinical', p: 'Warm, specific, human language — validated by psychological frameworks but never made you feel like a case study.' },
              { icon: '🔐', cls: 'fi-a', h: '100% anonymous', p: 'No account required. No data stored. Your conversation lives only in your browser session, then vanishes.' },
              { icon: '⚡', cls: 'fi-ro', h: 'Topic-focused safety', p: 'Dr. Mira stays in her lane. Ask about a recipe or a code bug — she gently redirects back to your inner world.' },
            ].map((f, i) => (
              <div key={f.h} className={`feat-card reveal reveal-delay-${i % 3}`}>
                <div className={`feat-icon ${f.cls}`}>{f.icon}</div>
                <h3>{f.h}</h3>
                <p>{f.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Frameworks ── */}
      <section className="l-section" id="psychology">
        <div className="l-wrap">
          <div className="l-section-head reveal">
            <span className="l-eyebrow ey-r">Theoretical Foundations</span>
            <h2>Informed by real psychology</h2>
            <p className="l-section-sub">The prompt draws naturally on 6 established therapeutic lenses — applied where they fit your exact words.</p>
          </div>
          <div className="fw-grid">
            {FRAMEWORKS.map((f, i) => (
              <div key={f.name} className={`fw-card reveal reveal-delay-${i % 3}`}>
                <div className="fw-emoji">{f.emoji}</div>
                <div className="fw-name">{f.name}</div>
                <div className="fw-sub">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="l-section">
        <div className="l-wrap">
          <div className="l-section-head reveal">
            <span className="l-eyebrow ey-a">Voices Like Yours</span>
            <h2>You are not alone in this</h2>
          </div>
          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={`testi-card reveal reveal-delay-${i % 2}`}>
                <div className="testi-quote">&ldquo;</div>
                <p className="testi-text">{t.text}</p>
                <div className="testi-author">Anonymous · CheckMyThoughts user</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="l-section">
        <div className="l-wrap">
          <div className="stats-card reveal">
            <div className="l-section-head" style={{ marginBottom: 'clamp(28px,5vw,44px)' }}>
              <span className="l-eyebrow ey-v">By the numbers</span>
              <h2>A space built for trust</h2>
            </div>
            <div className="stats-grid">
              <div className="reveal reveal-delay-1"><div className="stat-num">100%</div><div className="stat-label">Anonymous — zero data stored</div></div>
              <div className="reveal reveal-delay-2"><div className="stat-num">20</div><div className="stat-label">Message pairs remembered per session</div></div>
              <div className="reveal reveal-delay-3"><div className="stat-num">6+</div><div className="stat-label">Psychological frameworks in the prompt</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="l-section">
        <div className="l-wrap">
          <div className="l-cta reveal">
            <h2>Your mind deserves<br /><em style={{ fontStyle: 'italic', background: 'var(--grad-hero)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>to be understood.</em></h2>
            <p>Start a conversation with Dr. Mira. Share anything that's been weighing on you — she's here to reflect, not to judge.</p>
            <button className="btn-hero-primary" onClick={onStart} style={{ margin: '0 auto' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Start your reflection
            </button>
          </div>

          {/* Disclaimer */}
          <div className="l-disclaimer reveal">
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
            <p>
              <strong style={{ color: 'var(--rose-l)' }}>Important:</strong> CheckMyThoughts is an AI tool — not therapy, diagnosis, or crisis care. If you are in distress or danger, please contact a licensed professional or crisis line.{' '}
              <strong>US:</strong> <a href="tel:988">Call/text 988</a> · <strong>UK:</strong> <a href="https://www.samaritans.org" target="_blank" rel="noopener noreferrer">Samaritans 116 123</a> · <strong>International:</strong> <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">findahelpline.com</a>
            </p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="l-footer">
        <div className="l-footer-inner">
          {/* Brand */}
          <div className="footer-brand-col">
            <div className="footer-logo-row">
              <div className="footer-logo">🧠</div>
              <span className="footer-name">CheckMyThoughts</span>
            </div>
            <p className="footer-tag">Reflective AI for self-understanding — built with psychological depth, designed with compassion. Not a replacement for therapy.</p>
          </div>

          {/* Product */}
          <div>
            <div className="footer-col-title">Product</div>
            <div className="footer-links">
              <a href="#how">How it works</a>
              <a href="#features">Features</a>
              <a href="#psychology">Psychology</a>
              <a href="#" onClick={(e) => { e.preventDefault(); onStart(); }}>Start reflecting</a>
            </div>
          </div>

          {/* Resources */}
          <div>
            <div className="footer-col-title">Mental Health</div>
            <div className="footer-links">
              <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer">Find a Helpline</a>
              <a href="tel:988">988 Crisis Line (US)</a>
              <a href="https://www.samaritans.org" target="_blank" rel="noopener noreferrer">Samaritans (UK)</a>
              <a href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener noreferrer">Find a Therapist</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} CheckMyThoughts · AI Reflection Tool</span>
          <span>Not a substitute for professional mental health care</span>
        </div>
      </footer>
    </div>
  );
}
