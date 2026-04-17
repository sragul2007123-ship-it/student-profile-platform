import { VIEWS, RAIL } from "../../pages/learning/constants";

/**
 * ProgressRail — fixed step indicator shown on all screens except input.
 * Marks steps as done (green ✓), active (purple + ripple), or upcoming (grey).
 */
export default function ProgressRail({ view }) {
  const cur = VIEWS.indexOf(view === "loading" ? "notes" : view);

  return (
    <div className="progress-rail">
      {RAIL.map((s, i) => {
        const done   = i < cur;
        const active = i === cur;
        return (
          <div className="rail-step" key={s.label}>
            {i > 0 && (
              <div className="rail-line">
                <div className={`rail-line-fill${done ? " done" : ""}`} />
              </div>
            )}
            <div className="rail-node">
              <div className={`rail-dot${active ? " active" : done ? " done" : ""}`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`rail-label${active ? " active" : done ? " done" : ""}`}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
