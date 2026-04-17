/**
 * renderConcept — renders a **Bold**: text string as JSX.
 * e.g. "**Inertia**: tendency to resist change" →
 *      <><strong>Inertia</strong>: tendency to resist change</>
 */
export function rc(t) {
  const m = t.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
  return m ? (
    <>
      <strong>{m[1]}</strong>
      {m[2] ? `: ${m[2]}` : ""}
    </>
  ) : t;
}

/**
 * getConceptName — extracts just the bold term from a **Term**: string.
 * Falls back to first 30 chars of the raw string.
 */
export function gcn(t) {
  const m = t.match(/^\*\*(.+?)\*\*/);
  return m ? m[1] : t.slice(0, 30) + (t.length > 30 ? "…" : "");
}
