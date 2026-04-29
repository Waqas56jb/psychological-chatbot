import { useState, useRef, useEffect, useCallback } from 'react';
import { chatUrl } from '../api';
import './Home.css';

/** Scroll-triggered fade-up for sections (respects reduced-motion via CSS) */
function useScrollReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll('.home [data-reveal]');
    if (!nodes.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);
}

const CHIPS = [
  'I overthink everything',
  'I feel different from others',
  'I worry too much',
  'I feel empty inside',
  'I push people away',
];

const FAQ = [
  {
    q: 'Is this a replacement for therapy?',
    a: 'No. Psyche is a reflective tool to help you understand your thoughts and emotional patterns. For serious concerns, please reach out to a licensed therapist.',
  },
  {
    q: 'Is my conversation private?',
    a: 'Your messages are processed in real-time and are not stored permanently. We do not sell or share your data.',
  },
  {
    q: 'What topics can I discuss?',
    a: 'Psyche focuses exclusively on emotional and psychological experiences — anxiety, relationships, thought patterns, self-worth, fear, loneliness, and more.',
  },
  {
    q: 'How does memory work?',
    a: 'Psyche remembers up to 20 exchanges within your session. Clearing the chat or refreshing the page resets the conversation.',
  },
];

function fmtTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Home() {
  const [messages, setMessages]         = useState([]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [copied, setCopied]             = useState(null);
  const [openFaq, setOpenFaq]           = useState(null);
  const [bannerVisible, setBannerVisible] = useState(true);

  const textareaRef = useRef(null);
  const responseRef = useRef(null);
  const msgEndRef   = useRef(null);

  useScrollReveal();

  useEffect(() => {
    if (messages.length) {
      msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
  };

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '100px';

    const userMsg = { role: 'user', content: trimmed, id: Date.now(), time: fmtTime() };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    setTimeout(() => responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

    try {
      const res  = await fetch(chatUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: data.reply, id: Date.now() + 1, time: fmtTime() },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'error', content: err.message, id: Date.now() + 1 },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2200);
    });
  };

  const shareText = (text, id) => {
    if (navigator.share) {
      navigator.share({ title: 'Psyche Reflection', text });
    } else {
      copyText(text, id);
    }
  };

  return (
    <div className="home">
      <div className="home-sky" aria-hidden="true" />

      {/* ── Daily check-in banner ── */}
      {bannerVisible && (
        <div className="banner">
          <div className="banner-inner">
            <div className="banner-left">
              <span className="banner-title">Daily check-in</span>
              <span className="banner-desc">How are you feeling today? A quick check-in can help.</span>
            </div>
            <div className="banner-actions">
              <button className="btn-checkin" onClick={() => {
                setBannerVisible(false);
                textareaRef.current?.focus();
              }}>
                Check in
              </button>
              <button className="btn-later" onClick={() => setBannerVisible(false)}>
                Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main page ── */}
      <div className="page-wrap">

        {/* Journal button */}
        <div className="journal-row">
          <button className="btn-journal">📓 Journal</button>
        </div>

        {/* Hero */}
        <section className="hero hero-entrance">
          <span className="brand-label">CHECKMYTHOUGHTS</span>
          <h1 className="hero-title">Is This Normal?</h1>
          <p className="hero-sub">Type a thought or feeling and get instant reassurance.</p>
        </section>

        {/* Tool */}
        <section className="tool tool-entrance">
          <div className="tool-card">
            <textarea
              ref={textareaRef}
              className="tool-textarea"
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKey}
              placeholder="What's on your mind?"
              rows={4}
              maxLength={800}
              disabled={loading}
            />
            <button
              className="btn-check"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              {loading ? 'Thinking…' : 'Check This'}
            </button>
          </div>

          <div className="chips-row">
            <span className="chips-label">Or try one of these:</span>
            <div className="chips">
              {CHIPS.map(c => (
                <button
                  key={c}
                  className="chip"
                  onClick={() => sendMessage(c)}
                  disabled={loading}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Conversation / Response area ── */}
        {messages.length > 0 && (
          <section className="responses responses-enter" ref={responseRef}>
            <div className="responses-header">
              <span className="responses-label">Your conversation</span>
              <button className="btn-clear" onClick={() => setMessages([])}>
                Clear
              </button>
            </div>

            <div className="msg-list">
              {messages.map(m => {
                if (m.role === 'error') {
                  return (
                    <div key={m.id} className="msg-error">
                      ⚠ {m.content}
                    </div>
                  );
                }
                return (
                  <div key={m.id} className={`msg msg-${m.role}`}>
                    <div className="msg-ava">
                      {m.role === 'ai' ? '🧠' : '👤'}
                    </div>
                    <div className="msg-body">
                      <div className="msg-bubble">{m.content}</div>
                      <div className="msg-foot">
                        <span className="msg-time">{m.time}</span>
                        {m.role === 'ai' && (
                          <div className="msg-actions">
                            <button
                              className="action-btn"
                              onClick={() => copyText(m.content, m.id)}
                            >
                              {copied === m.id ? '✓ Copied' : '⎘ Copy'}
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => shareText(m.content, m.id)}
                            >
                              ↗ Share
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="msg msg-ai">
                  <div className="msg-ava">🧠</div>
                  <div className="typing-bubble">
                    <span /><span /><span />
                  </div>
                </div>
              )}

              <div ref={msgEndRef} />
            </div>

            {/* Follow-up input */}
            <div className="followup">
              <textarea
                className="followup-ta"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask a follow-up…"
                rows={2}
                maxLength={800}
                disabled={loading}
              />
              <button
                className="btn-send"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                aria-label="Send"
              >
                ↑
              </button>
            </div>
          </section>
        )}

        {/* ── How it works ── */}
        <section className="how">
          <h2 className="section-title section-title-reveal" data-reveal>How it works</h2>
          <div className="how-steps">
            {[
              { n: '1', icon: '✍️', title: 'Share your thought', desc: 'Type anything you\'ve been feeling or worrying about. No right or wrong way to start.' },
              { n: '2', icon: '🔍', title: 'Psyche reflects', desc: 'Using 6+ therapy frameworks, Psyche reads patterns in your words and offers grounded insight.' },
              { n: '3', icon: '💡', title: 'Gain clarity', desc: 'Walk away with a new perspective and one gentle, actionable step you can take today.' },
            ].map((s) => (
              <div key={s.n} className="how-step" data-reveal>
                <div className="how-num">{s.n}</div>
                <div className="how-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="faq" data-reveal>
          <h2 className="section-title">FAQ</h2>
          <div className="faq-list">
            {FAQ.map((item, i) => (
              <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{item.q}</span>
                  <span className="faq-icon">{openFaq === i ? '−' : '+'}</span>
                </button>
                <div className="faq-a"><p>{item.a}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="footer" data-reveal>
          <div className="footer-brand">
            <span className="brand-label">CHECKMYTHOUGHTS</span>
          </div>
          <p className="footer-note">
            Not a substitute for professional mental health care. If you are in
            crisis, call <strong>988</strong> (US) or <strong>116 123</strong> (UK).
          </p>
          <p className="footer-copy">© 2025 CheckMyThoughts</p>
        </footer>

      </div>
    </div>
  );
}
