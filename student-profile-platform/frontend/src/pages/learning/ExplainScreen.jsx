import { useState, useRef, useEffect } from "react";
import { checkExplanation, analyzeThinking } from "../../services/aiService";
import { rc, gcn } from "../../components/learning/utils";
import SRing from "../../components/learning/SRing";
import { MICONS } from "./constants";

/**
 * ExplainScreen — step 3.
 * Student picks a concept tab, writes an explanation, and submits.
 * Fires checkExplanation + analyzeThinking in parallel, then shows
 * the SRing score, Mellow's prose feedback, and any mistake cards.
 */
export default function ExplainScreen({ notes, onNext }) {
  const [sel,      setSel]      = useState(0);
  const [text,     setText]     = useState("");
  const [checking, setChecking] = useState(false);
  const [fb,       setFb]       = useState("");
  const [an,       setAn]       = useState(null);
  const [err,      setErr]      = useState("");
  const ta = useRef(null);

  const concept = notes.keyConcepts[sel];
  const name    = gcn(concept);
  const min     = 40;
  const pct     = Math.min((text.length / min) * 100, 100);
  const can     = text.trim().length >= min && !checking;

  // Reset state when concept tab changes
  useEffect(() => {
    setText("");
    setFb("");
    setAn(null);
    setErr("");
    ta.current?.focus();
  }, [sel]);

  const check = async () => {
    if (!can) return;
    setChecking(true);
    setFb("");
    setAn(null);
    setErr("");
    const ctx = `Title: ${notes.title}\nSummary: ${notes.summary}\nKey Concepts:\n${notes.keyConcepts.join("\n")}`;
    try {
      const f = await checkExplanation(name, text, ctx);
      const a = await analyzeThinking(name, text, ctx);
      setFb(f);
      setAn(a);
    } catch {
      setErr("Couldn't reach Mellow. Please try again.");
    }
    setChecking(false);
  };

  const retry = () => {
    setText("");
    setFb("");
    setAn(null);
    ta.current?.focus();
  };

  return (
    <div className="explain-wrap screen-enter">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="eyebrow"><span className="el" />Explain Back</div>
        <h1 className="pgttl" style={{ fontSize: "clamp(30px,4vw,44px)" }}>
          Put it in your <em>own words.</em>
        </h1>
        <p className="pgsub" style={{ marginBottom: 0 }}>
          Pick a concept below and explain it like you're teaching a friend. No peeking at your notes.
        </p>
      </div>

      {/* Concept tabs */}
      <div className="ctabs">
        {notes.keyConcepts.map((c, i) => (
          <button
            key={i}
            className={`ctab${sel === i ? " active" : ""}`}
            onClick={() => setSel(i)}
          >
            {gcn(c)}
          </button>
        ))}
      </div>

      {/* Concept reference */}
      <div className="cref" key={sel}>
        <div className="cref-lbl">📖 From your notes</div>
        <div className="cref-txt">{rc(concept)}</div>
      </div>

      {/* Encouragement banner */}
      <div className="enc-banner">
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🌿</span>
        <div className="enc-txt">
          <strong>No pressure.</strong> Write what makes sense to you. Mistakes are how you learn — Mellow will give kind, specific feedback.
        </div>
      </div>

      {/* Writing card */}
      <div className="xcard">
        <div className="xprompt">
          Explain <em>"{name}"</em><br />in your own words.
        </div>

        <textarea
          ref={ta}
          className="xta"
          placeholder="I think this means… The way I understand it is…"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (fb) { setFb(""); setAn(null); }
          }}
          disabled={checking}
          autoFocus
        />

        {/* Progress bar + char count */}
        <div className="xmeta">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="cbw">
              <div className="cbf" style={{ width: `${pct}%` }} />
            </div>
            <span className={`clbl${text.length >= min ? " rdy" : ""}`}>
              {text.length >= min ? "✓ Ready" : `${text.length} / ${min}`}
            </span>
          </div>
          {text.length > 0 && (
            <button
              onClick={retry}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--muted)", fontFamily: "inherit" }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="xfoot">
          <div className="xhint">
            <span style={{ fontSize: 13 }}>💬</span>
            Mellow analyses clarity, logic, and any gaps.
          </div>
          <button className="btn-chk" onClick={check} disabled={!can}>
            {checking ? (
              <>Checking…</>
            ) : (
              <>
                Check My Thinking{" "}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 4l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </div>

        {checking && (
          <div className="chin">
            <div className="spin" />
            Reading your explanation and analysing thinking…
          </div>
        )}
      </div>

      {err && <div className="err">✕ &nbsp;{err}</div>}

      {/* Results panel */}
      {(fb || an) && (
        <div className="rp">
          {an && <SRing score={an.score} label={an.scoreLabel} />}

          {fb && (
            <div className="fbcard">
              <div className="fbhead">
                <div className="fbav">✦</div>
                <div>
                  <div className="fblbl">Mellow's Feedback</div>
                  <div className="fbsub">On "{name}"</div>
                </div>
              </div>
              <div className="fbbody">{fb}</div>
            </div>
          )}

          {an && (
            <div>
              <div className="mhdr">
                <div className="mlbl">Thinking Patterns</div>
                {an.mistakes?.length > 0
                  ? <span className="mcnt">{an.mistakes.length} to work on</span>
                  : <span className="clean-b">✓ No gaps</span>
                }
              </div>

              {an.mistakes?.length === 0 && (
                <div className="acc">
                  <span style={{ fontSize: 20 }}>🎯</span>
                  <div>
                    <strong style={{ display: "block", fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 3 }}>
                      Clean thinking!
                    </strong>
                    <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 300 }}>
                      Your explanation is clear and complete.
                    </span>
                  </div>
                </div>
              )}

              {an.mistakes?.length > 0 && (
                <div className="mlist">
                  {an.mistakes.map((m, i) => (
                    <div className="mc" key={i}>
                      <div className="mciw">{MICONS[m.type] || "⚠️"}</div>
                      <div>
                        <div className="mtp">{m.type}</div>
                        <div className="mttl">{m.title}</div>
                        <div className="mdsc">{m.description}</div>
                        {m.hint && <div className="mhnt">{m.hint}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="ract">
            <button
              className="btn-chk"
              style={{ minWidth: "unset", padding: "10px 20px", fontSize: 13 }}
              onClick={retry}
            >
              Try again ↺
            </button>
            {sel < notes.keyConcepts.length - 1 && (
              <button
                className="btn-ghost"
                style={{ padding: "10px 18px", fontSize: 13 }}
                onClick={() => setSel((i) => i + 1)}
              >
                Next concept →
              </button>
            )}
            <button
              className="btn-primary"
              style={{ padding: "10px 20px", fontSize: 13, background: "linear-gradient(135deg,#1F2933,#2D3748)", boxShadow: "0 4px 18px rgba(31,41,51,0.2)" }}
              onClick={onNext}
            >
              ⚡ Enter Debate
            </button>
          </div>
        </div>
      )}

      {/* Pre-submit tips */}
      {!fb && !an && (
        <div style={{ marginTop: 28, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["Use simple language", "Analogies help", "Don't peek", "Mistakes = learning"].map((t, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid rgba(31,41,51,0.07)", borderRadius: "50px", padding: "6px 13px", fontSize: 12, color: "var(--muted)", fontWeight: 300, boxShadow: "0 2px 5px rgba(31,41,51,0.04)" }}
            >
              <span>💡</span>{t}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
