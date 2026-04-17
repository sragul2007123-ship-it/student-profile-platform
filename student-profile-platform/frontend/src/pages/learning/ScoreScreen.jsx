import ABar from "../../components/learning/ABar";
import { DIMS } from "./constants";

/**
 * ScoreScreen — step 5.
 * Displays the overall score orb, three dimension cards with animated bars,
 * Mellow's overall feedback paragraph, and next-step suggestions.
 */
export default function ScoreScreen({ scores, notes, onDebateAgain }) {
  const total = Math.round(((scores.clarity + scores.logic + scores.understanding) / 3) * 10) / 10;
  const lbl   = total >= 8 ? "Exceptional" : total >= 6 ? "Strong" : total >= 4 ? "Developing" : "Building";
  const em    = total >= 8 ? "🌟"          : total >= 6 ? "💪"     : total >= 4 ? "🌱"         : "🔥";

  return (
    <div className="score-wrap screen-enter">
      {/* Hero orb */}
      <div className="score-hero">
        <div className="sorb">
          <div className="sorb-inner">
            <div className="sorb-num">{total.toFixed(1)}</div>
            <div className="sorb-den">out of 10</div>
          </div>
        </div>
        <h1 className="sttl2">{em} <em>{lbl}</em> thinking.</h1>
        <p className="ssub2">
          Based on {scores._count} debate responses on <strong>{notes.title}</strong>.
        </p>
      </div>

      {/* Dimension cards */}
      <div className="dims">
        {DIMS.map((d, i) => {
          const s   = scores[d.key];
          const fk  = d.key + "Feedback";
          const pct = (s / 10) * 100;
          const col = s >= 8 ? "#4CAF50" : s >= 5 ? d.a : "#E8845A";
          return (
            <div className="dcard" key={d.key}>
              <div className="dhdr">
                <div className="dleft">
                  <div className="dicon" style={{ background: d.bg }}>{d.icon}</div>
                  <div>
                    <div className="dname">{d.label}</div>
                    <div className="ddesc">{d.desc}</div>
                  </div>
                </div>
                <div>
                  <span className="dscore" style={{ color: col }}>{s}</span>
                  <span className="dden"> /10</span>
                </div>
              </div>
              <ABar pct={pct} from={d.a} to={d.b} delay={i * 110} />
              {scores[fk] && <div className="dfb">{scores[fk]}</div>}
            </div>
          );
        })}
      </div>

      {/* Overall feedback */}
      <div className="ovfb">
        <div className="ovfb-hd">
          <div className="ovav">✦</div>
          <div>
            <div className="ovlbl">Mellow's Summary</div>
            <div className="ovsl">Overall assessment of your session</div>
          </div>
        </div>
        <div className="ovtxt">{scores.overallFeedback}</div>
      </div>

      {/* Next steps */}
      {scores.nextSteps?.length > 0 && (
        <div className="nxt">
          <div className="nxt-ttl">To sharpen your thinking…</div>
          <div className="nxt-list">
            {scores.nextSteps.map((s, i) => (
              <div className="nxi" key={i}>
                <div className="nxn">{i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="score-acts">
        <button className="btn-primary" onClick={onDebateAgain}>⚡ Debate again</button>
        <button className="btn-ghost" onClick={() => window.location.reload()}>Start new lecture</button>
      </div>
    </div>
  );
}
