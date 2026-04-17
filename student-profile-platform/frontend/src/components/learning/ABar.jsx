import { useState, useEffect } from "react";

/**
 * ABar — animated gradient progress bar used on the Score screen.
 * Starts at 0 and transitions to `pct` after a short delay.
 */
export default function ABar({ pct, from, to, delay = 0 }) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(pct), 80 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="dtrack">
      <div
        className="dfill"
        style={{
          width: `${w}%`,
          background: `linear-gradient(90deg,${from},${to})`,
          transitionDelay: `${delay}ms`,
        }}
      />
    </div>
  );
}
