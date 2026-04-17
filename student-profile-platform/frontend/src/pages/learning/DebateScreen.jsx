import { useState, useRef, useEffect, useCallback } from "react";
import { debateReply, scoreThinking } from "../../services/aiService";
import { OPENINGS, QREPS, ts } from "./constants";

/**
 * DebateScreen — step 4.
 * Socratic chat with Mellow. Tracks the full message history, shows a
 * typing indicator while waiting for replies, surfaces quick-reply chips,
 * and unlocks the "Score session" button after 3 user messages.
 */
export default function DebateScreen({ notes, onScore }) {
  const ctx = `Title: ${notes.title}\nSummary: ${notes.summary}\nKey Concepts:\n${notes.keyConcepts.join("\n")}`;

  const [msgs,    setMsgs]    = useState([{ role: "assistant", content: OPENINGS[Math.floor(Math.random() * 3)], time: ts() }]);
  const [inp,     setInp]     = useState("");
  const [typing,  setTyping]  = useState(false);
  const [scoring, setScoring] = useState(false);
  const [err,     setErr]     = useState("");
  const [showQR,  setShowQR]  = useState(true);

  const bot    = useRef(null);
  const inpRef = useRef(null);

  const userMsgs = msgs.filter((m) => m.role === "user");
  const umc      = userMsgs.length;
  const canScore = umc >= 3;

  // Auto-scroll to bottom on every new message
  useEffect(() => {
    bot.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = useCallback(
    async (t) => {
      const text = (t || inp).trim();
      if (!text || typing) return;
      setInp("");
      setShowQR(false);
      setErr("");
      const um   = { role: "user", content: text, time: ts() };
      const hist = [...msgs, um];
      setMsgs(hist);
      setTyping(true);
      try {
        const r = await debateReply(hist.map((m) => ({ role: m.role, content: m.content })), ctx);
        setMsgs((p) => [...p, { role: "assistant", content: r, time: ts() }]);
        if ((umc + 1) % 2 === 0) setShowQR(true);
      } catch {
        setErr("Connection lost. Try again.");
      }
      setTyping(false);
      setTimeout(() => inpRef.current?.focus(), 80);
    },
    [inp, msgs, typing, ctx, umc]
  );

  const doScore = async () => {
    if (!canScore || scoring) return;
    setScoring(true);
    const transcript = userMsgs.map((m, i) => `[${i + 1}] ${m.content}`).join("\n");
    try {
      const r = await scoreThinking(transcript, ctx);
      onScore({ ...r, _count: umc });
    } catch {
      setErr("Couldn't generate score. Please try again.");
      setScoring(false);
    }
  };

  // ── Scoring loading state ──────────────────────────────────────────────────
  if (scoring) {
    return (
      <div className="scl-wrap screen-enter">
        <div className="lorb" />
        <div className="scl-ttl">Scoring your thinking…</div>
        <div className="scl-sub">Analysing {umc} responses across 3 dimensions</div>
        <div className="scl-steps">
          {[
            "Reading your debate responses",
            "Evaluating clarity of expression",
            "Assessing logical reasoning",
            "Measuring conceptual understanding",
            "Generating personalised feedback",
          ].map((s, i) => (
            <div key={i} className="scl-step a">
              <div className="spin" style={{ width: 12, height: 12, marginRight: 4 }} />
              {s}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Chat UI ────────────────────────────────────────────────────────────────
  return (
    <div className="debate-inner screen-enter">
      {/* Topic bar */}
      <div className="dtopic">
        <div className="dtopic-l">
          <div className="dtopic-icon">⚡</div>
          <div>
            <div className="dtopic-name">Debate Mode</div>
            <div className="dtopic-ttl">{notes.title}</div>
          </div>
        </div>
        <div className="dtopic-r">
          <span className="dmc">{umc} {umc === 1 ? "reply" : "replies"}</span>
          <button
            className="btn-score"
            onClick={doScore}
            disabled={!canScore || typing}
            title={!canScore ? `${3 - umc} more to unlock` : ""}
          >
            {canScore ? "📊 Score session" : `${3 - umc} more to score`}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-msgs">
        <div className="sysmsg">
          <span>🧠 Mellow questions your thinking — it never gives the answer</span>
        </div>

        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role === "user" ? "user" : "ai"}`}>
            <div className={`mav ${m.role === "ai" ? "aav" : "uav"}`}>
              {m.role === "ai" ? "✦" : "🙋"}
            </div>
            <div>
              <div className="mbub">{m.content}</div>
              <div className="mtime">{m.time}</div>
            </div>
          </div>
        ))}

        {typing && (
          <div className="msg ai">
            <div className="mav aav">✦</div>
            <div>
              <div className="tbub">
                <div className="tdot" /><div className="tdot" /><div className="tdot" />
              </div>
            </div>
          </div>
        )}

        {err && <div className="err" style={{ margin: "6px 0" }}>✕ &nbsp;{err}</div>}

        {umc === 3 && msgs[msgs.length - 1]?.role === "assistant" && (
          <div className="sysmsg"><span>💪 3 replies in — you can score now, or keep going</span></div>
        )}
        {umc === 7 && msgs[msgs.length - 1]?.role === "assistant" && (
          <div className="sysmsg"><span>🔥 Deep session — your score will reflect this depth</span></div>
        )}

        <div ref={bot} />
      </div>

      {/* Quick replies */}
      {showQR && !typing && msgs[msgs.length - 1]?.role === "assistant" && (
        <div className="qreps">
          {QREPS.slice(0, 3).map((q, i) => (
            <button key={i} className="qr" onClick={() => send(q)}>{q}</button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="cinput-bar">
        <div className="cinput-wrap">
          <textarea
            ref={inpRef}
            className="cinput"
            placeholder="Share your thinking… Mellow will question it 🤔"
            value={inp}
            onChange={(e) => setInp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            rows={1}
            disabled={typing}
          />
          <button className="csend" onClick={() => send()} disabled={!inp.trim() || typing}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M2 7.5h11M9 4l3.5 3.5L9 11" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="cwarn">
          Enter to send · Shift+Enter for new line{canScore ? " · Score any time" : ""}
        </div>
      </div>
    </div>
  );
}
