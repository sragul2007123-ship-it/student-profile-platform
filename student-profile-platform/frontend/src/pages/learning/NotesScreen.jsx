import { rc } from "../../components/learning/utils";

/**
 * NotesScreen — step 2.
 * Displays generated notes (overview, key concepts, explanations, highlights).
 * Copy button assembles markdown and writes to clipboard.
 * Two CTAs navigate to Explain Back or straight to Debate.
 */
export default function NotesScreen({ notes, onNext, onNextDebate }) {
  const handleCopy = () => {
    const t =
      `# ${notes.title}\n\n` +
      `## Summary\n${notes.summary}\n\n` +
      `## Key Concepts\n${notes.keyConcepts.map((c) => `• ${c}`).join("\n")}\n\n` +
      `## Explanations\n${notes.explanations.map((e) => `**${e.term}**: ${e.definition}`).join("\n")}\n\n` +
      `## Highlights\n${notes.highlights.map((h) => `★ ${h}`).join("\n")}`;
    navigator.clipboard.writeText(t).catch(() => {});
  };

  return (
    <div className="notes-wrap screen-enter">
      {/* Header */}
      <div className="notes-hdr">
        <div>
          <div className="eyebrow"><span className="el" />Your Study Notes</div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(28px,4vw,42px)",
            fontWeight: 300,
            letterSpacing: "-1px",
            lineHeight: 1.15,
            fontStyle: "italic",
            color: "var(--primary)",
          }}>
            {notes.title}
          </h1>
        </div>
        <div className="notes-btns">
          <button className="btn-ghost" style={{ fontSize: 12, padding: "8px 16px" }} onClick={handleCopy}>
            Copy
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="notes-grid">
        {/* Overview */}
        <div className="ncard">
          <div className="ncard-head">
            <div className="ncard-icon ni-p">📖</div>
            <span className="ncard-lbl">Overview</span>
          </div>
          <div className="sum">{notes.summary}</div>
        </div>

        {/* Key Concepts */}
        <div className="ncard">
          <div className="ncard-head">
            <div className="ncard-icon ni-p">🧩</div>
            <span className="ncard-lbl">Key Concepts</span>
          </div>
          <div className="concepts-list">
            {notes.keyConcepts.map((c, i) => (
              <div className="ci" key={i}>
                <div className="cbullet" />
                <div className="ctext">{rc(c)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Explanations */}
        <div className="ncard">
          <div className="ncard-head">
            <div className="ncard-icon ni-b">💡</div>
            <span className="ncard-lbl">Explanations</span>
          </div>
          <div className="elist">
            {notes.explanations.map((e, i) => (
              <div className="ei" key={i}>
                <div className="eterm">{e.term}</div>
                <div className="edef">{e.definition}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="ncard">
          <div className="ncard-head">
            <div className="ncard-icon ni-g">⭐</div>
            <span className="ncard-lbl">Key Highlights</span>
          </div>
          <div className="hgrid">
            {notes.highlights.map((h, i) => (
              <div className="hchip" key={i}>
                <span className="hstar">★</span>{h}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA strip */}
      <div className="next-strip">
        <div className="ns-text">
          <h3>Ready to test your thinking?</h3>
          <p>Explain a concept back to Mellow, or jump straight into debate mode.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
          <button className="btn-wh" onClick={onNext}>Explain Back →</button>
          <button
            className="btn-wh"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.22)" }}
            onClick={onNextDebate}
          >
            ⚡ Debate
          </button>
        </div>
      </div>
    </div>
  );
}
