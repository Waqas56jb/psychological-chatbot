import { useCallback, useEffect, useRef, useState } from 'react';
import { chatUrl } from '../api.js';
import './Chat.css';

const MAX_CHARS = 800;
const MAX_MSGS  = 40; // 20 pairs

const QUICK_CHIPS = [
  { text: '🌀 I overthink everything', fill: 'I overthink everything constantly. My mind never stops and I feel exhausted by my own thoughts.' },
  { text: '💔 Fear of abandonment',   fill: 'I have a deep fear of being abandoned by the people I love, even when they show no signs of leaving.' },
  { text: '😰 I worry too much',      fill: 'I worry constantly about things that probably will not happen but I cannot stop the anxious thoughts.' },
  { text: '🕯️ I feel emotionally numb',fill: 'I feel emotionally numb or empty inside, like I can observe my life but not truly feel it.' },
  { text: '🎭 I perform being okay',  fill: 'I feel like I have to pretend to be okay all the time, even when I am exhausted and struggling inside.' },
  { text: '😔 Unexplained guilt',     fill: 'I feel guilty even when I have not done anything wrong. I constantly second-guess everything I do.' },
  { text: '🌿 I do not belong',       fill: 'I feel like I do not truly belong anywhere — even around people who care about me I feel like an outsider.' },
  { text: '🔄 I self-sabotage',       fill: 'I keep getting in my own way. Every time something good happens, I find a way to ruin it.' },
];

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat({ onBack }) {
  const [messages, setMessages]   = useState([]); // { id, role, content, time }
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const messagesEnd               = useRef(null);
  const textareaRef               = useRef(null);
  const inputLock                 = useRef(false);

  /* auto-scroll to latest message */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* auto-resize textarea */
  const handleInput = useCallback((e) => {
    const val = e.target.value.slice(0, MAX_CHARS);
    setInput(val);
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }
  }, []);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading || inputLock.current) return;

    setInput('');
    setError('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
    inputLock.current = true;

    const userMsg = { id: Date.now(), role: 'user', content, time: new Date() };
    setMessages((prev) => [...prev.slice(-(MAX_MSGS - 1)), userMsg]);
    setLoading(true);

    /* Build payload: only role + content, trimmed to last 40 */
    const payload = [...messages, userMsg]
      .slice(-MAX_MSGS)
      .map(({ role, content: c }) => ({ role, content: c }));

    try {
      const res = await fetch(chatUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

      const aiMsg = { id: Date.now() + 1, role: 'assistant', content: data.reply, time: new Date() };
      setMessages((prev) => [...prev.slice(-(MAX_MSGS - 1)), aiMsg]);
    } catch (e) {
      setError(e.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
      inputLock.current = false;
    }
  }, [input, loading, messages]);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError('');
    setInput('');
  }, []);

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-page">
      <div className="chat-bg" aria-hidden />

      {/* ── Header ── */}
      <header className="chat-header">
        <div className="chat-header-left">
          <button className="chat-back" onClick={onBack} title="Back to home" aria-label="Back">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
            </svg>
          </button>
          <div className="chat-bot-info">
            <div className="chat-bot-avatar">🧠</div>
            <div>
              <div className="chat-bot-name">Psyche AI</div>
              <div className="chat-bot-status">
                <span className="status-dot" />
                {loading ? 'Reflecting…' : 'Online · Psychological AI'}
              </div>
            </div>
          </div>
        </div>

        <div className="chat-header-right">
          <div className="chat-memory-badge">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 22V12m0 0L7 7m5 5 5-5"/><circle cx="12" cy="5" r="3"/>
            </svg>
            Remembers 20 exchanges
          </div>
          {messages.length > 0 && (
            <button className="chat-clear-btn" onClick={clearChat}>New chat</button>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="chat-messages">
        {isEmpty ? (
          <div className="chat-welcome">
            <div className="welcome-avatar pulse-ring">🧠</div>
            <div className="welcome-title">Hello, I'm Psyche.</div>
            <p className="welcome-sub">
              Share what's on your mind — a feeling, a thought pattern, a fear, or
              something you've been carrying. I'm here to reflect, not to judge.
            </p>
            <div className="welcome-chips">
              {QUICK_CHIPS.map((c) => (
                <button
                  key={c.text}
                  className="welcome-chip"
                  onClick={() => sendMessage(c.fill)}
                >
                  {c.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
              {msg.role === 'assistant' && (
                <div className="msg-avatar" aria-hidden>🧠</div>
              )}
              {msg.role === 'user' && (
                <div className="msg-avatar" aria-hidden>👤</div>
              )}
              <div className="msg-content">
                <div className="msg-bubble">{msg.content}</div>
                <div className="msg-time">{formatTime(msg.time)}</div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {loading && (
          <div className="typing-msg">
            <div className="msg-avatar" aria-hidden>🧠</div>
            <div className="typing-bubble" aria-label="Psyche is thinking">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="chat-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <div ref={messagesEnd} />
      </div>

      {/* ── Input ── */}
      <div className="chat-input-area">
        <div className="chat-input-wrap">
          <div className="chat-textarea-wrap">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={onKeyDown}
              placeholder="Share what's on your mind…"
              maxLength={MAX_CHARS}
              aria-label="Your message"
              disabled={loading}
            />
            {input.length > 600 && (
              <div className="char-hint">{input.length}/{MAX_CHARS}</div>
            )}
          </div>
          <button
            className="chat-send"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite', transformOrigin: 'center' }}/>
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="m22 2-7 20-4-9-9-4 20-7z"/>
              </svg>
            )}
          </button>
        </div>
        <div className="chat-hints">
          <span>Shift + Enter for new line · Enter to send</span>
          <span>🔐 Private session — nothing is stored</span>
        </div>
      </div>
    </div>
  );
}
