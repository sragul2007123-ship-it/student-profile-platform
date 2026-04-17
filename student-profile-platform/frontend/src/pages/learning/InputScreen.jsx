import { useState, useRef, useEffect } from "react";
import { generateNotes } from "../../services/aiService";
import { SAMPLE } from "./constants";

const LOAD_MSGS = [
  "Reading your lecture…",
  "Identifying key concepts…",
  "Structuring your notes…",
  "Adding clear explanations…",
  "Almost ready…",
];

/**
 * InputScreen — step 1.
 * Accepts pasted text or a .txt file upload, then calls generateNotes()
 * and passes the result up via onNext().
 */
export default function InputScreen({ onNext }) {
  const [text,     setText]     = useState("");
  const [err,      setErr]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [msg,      setMsg]      = useState(LOAD_MSGS[0]);
  const [loadStep, setLoadStep] = useState(0);
  const fileRef = useRef(null);

  const wc    = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canGo = text.trim().length > 20 && !loading;

  // Cycle through loading messages, lighting up each step
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    setLoadStep(0);
    const t = setInterval(() => {
      i = Math.min(i + 1, LOAD_MSGS.length - 1);
      setLoadStep(i);
      setMsg(LOAD_MSGS[i]);
    }, 1400);
    return () => clearInterval(t);
  }, [loading]);

  const go = async () => {
    if (!canGo) return;
    setErr("");
    setLoading(true);
    setLoadStep(0);
    try {
      const n = await generateNotes(text);
      onNext(n);
    } catch {
      setErr("Couldn't generate notes. Please try again.");
      setLoading(false);
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setText(ev.target.result);
    r.readAsText(file);
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="load-wrap screen-enter">
        <div className="lorb" />
        <div className="lttl">Structuring your notes</div>
        <div className="lsub">{msg}</div>
        <div className="lbar">
          <div className="lbar-fill" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {LOAD_MSGS.map((s, i) => (
            <div
              key={i}
              className={`lstep${i <= loadStep ? " vis" : ""}`}
              style={{
                animationDelay: `${i * 0.18}s`,
                opacity: i <= loadStep ? 1 : 0,
                transition: "opacity .4s ease",
              }}
            >
              <div
                className="lstep-dot"
                style={{
                  background:
                    i < loadStep  ? "var(--success)" :
                    i === loadStep ? "var(--primary)" : "var(--soft)",
                  animation: i === loadStep ? "pdot 1.4s ease-in-out infinite" : "none",
                }}
              />
              <span
                style={{
                  color:
                    i < loadStep  ? "var(--success)" :
                    i === loadStep ? "var(--primary)" : "var(--muted)",
                  fontWeight: i === loadStep ? 400 : 300,
                }}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="input-wrap screen-enter">
      <div className="input-header">
        <div className="eyebrow"><span className="el" />Lecture Input</div>
        <h1 className="pgttl">Drop your <em>lecture.</em><br />We'll do the rest.</h1>
        <p className="pgsub">
          Paste any lecture, transcript, or reading. Mellow structures it into clean study notes instantly.
        </p>
      </div>

      <div className="icard">
        <div className="itoolbar">
          <div className="ilabel">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2"   width="12"  height="1.4" rx=".7" fill="var(--muted)" />
              <rect x="1" y="5.6" width="9"   height="1.4" rx=".7" fill="var(--muted)" />
              <rect x="1" y="9.2" width="10.5" height="1.4" rx=".7" fill="var(--muted)" />
            </svg>
            Lecture content
          </div>
          {wc > 0 && <span className={`wc${wc > 10 ? " on" : ""}`}>{wc} words</span>}
        </div>

        <textarea
          className="lta"
          placeholder="Paste your lecture or notes here..."
          value={text}
          onChange={(e) => { setText(e.target.value); setErr(""); }}
          spellCheck={false}
        />

        <div className="idivider">or upload a file</div>

        <button
          className="upzone"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f?.type === "text/plain") handleFile(f);
          }}
        >
          <div className="upicon">
            <svg width="19" height="19" viewBox="0 0 20 20" fill="none">
              <path d="M10 13V4M10 4L7 7M10 4L13 7" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="uptxt">
            <strong>Upload a file</strong>
            <span>Drag & drop or click to browse</span>
          </div>
          <div className="upbadge">Text Files (.txt)</div>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".txt"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div className="ifoot">
          <div className="ihint">
            <span className="hdot" style={{ background: wc > 10 ? "var(--success)" : "var(--muted)" }} />
            {wc < 10 ? "Add at least a few sentences" : `Ready — ${wc} words detected`}
          </div>
          <button className="btn-primary" onClick={go} disabled={!canGo}>
            Generate Notes{" "}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 4l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {err && <div className="err">✕ &nbsp;{err}</div>}

      <div className="ichips">
        {[
          { e: "📋", l: "Paste a transcript" },
          { e: "🎓", l: "Any subject" },
          { e: "⚡", l: "Results in ~10s" },
          { e: "🔒", l: "Private" },
        ].map((c, i) => (
          <div className="ichip" key={i}>
            <span>{c.e}</span>{c.l}
          </div>
        ))}
        {!text && (
          <button className="ichip ichip-btn" onClick={() => setText(SAMPLE)}>
            <span>✨</span>Try a sample
          </button>
        )}
      </div>
    </div>
  );
}
