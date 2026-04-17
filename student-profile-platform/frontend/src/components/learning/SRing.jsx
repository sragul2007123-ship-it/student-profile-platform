/**
 * SRing — circular SVG score ring shown after an explanation is checked.
 * Renders a proportional arc and a banner with label + message.
 */
export default function SRing({ score, label }) {
  const r   = 20;
  const c   = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const col = score >= 75 ? "#4CAF50" : score >= 45 ? "#7C6CF2" : "#E8845A";
  const cls = score >= 75 ? "great"   : score >= 45 ? "ok"      : "nw";

  const msgs = {
    Excellent:    "Solid thinking.",
    Good:         "Good — a few things to sharpen.",
    Developing:   "On the right track.",
    "Needs Work": "Good starting point.",
  };

  return (
    <div className={`sbanner ${cls}`}>
      <div className="sring">
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle className="srt" cx="26" cy="26" r={r} />
          <circle
            className="srf"
            cx="26"
            cy="26"
            r={r}
            stroke={col}
            strokeDasharray={c}
            strokeDashoffset={off}
          />
        </svg>
        <div className="srn">{score}</div>
      </div>
      <div>
        <div className="sttl">
          {score >= 75 ? "🌟" : score >= 45 ? "💪" : "🌱"} {label}
        </div>
        <div className="ssub">{msgs[label] || "Keep going."}</div>
      </div>
    </div>
  );
}
