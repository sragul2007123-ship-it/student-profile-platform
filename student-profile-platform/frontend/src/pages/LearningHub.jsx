import { useState } from "react";
import "./learning/learning.css";
import ProgressRail from "../../components/learning/ProgressRail";
import InputScreen  from "./learning/InputScreen";
import NotesScreen  from "./learning/NotesScreen";
import ExplainScreen from "./learning/ExplainScreen";
import DebateScreen  from "./learning/DebateScreen";
import ScoreScreen   from "./learning/ScoreScreen";

/**
 * LearningHub — This is the main entry point for the integrated Mellow features.
 * It manages the sub-navigation between learning screens.
 */
export default function LearningHub() {
  const [view,   setView]   = useState("input");
  const [notes,  setNotes]  = useState(null);
  const [scores, setScores] = useState(null);
  const [key,    setKey]    = useState(0);

  const go = (v, extra = {}) => {
    if (extra.notes)  setNotes(extra.notes);
    if (extra.scores) setScores(extra.scores);
    setView(v);
    setKey((k) => k + 1);
  };

  // Back-navigation map: each view knows where its back button leads
  const BACK = {
    notes:   () => go("input"),
    explain: () => go("notes"),
    debate:  () => go("notes"),
    score:   () => go("debate"),
  };

  const isDebate = view === "debate";
  const showRail = view !== "input";

  return (
    <div className="learning-container">
      {/* Ambient blobs */}
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />

      {/* Internal Navigation for Mellow (Simplified) */}
      <div className="flex justify-between items-center px-8 py-4 sticky top-0 bg-white/80 backdrop-blur-md z-[100] border-bottom border-gray-100">
        <div className="text-xl font-bold cursor-pointer hover:opacity-70 transition-all" onClick={() => go("input")}>
           <span className="text-[#7C6CF2]">Mellow</span> hub
        </div>
        <div className="flex gap-4">
            {BACK[view] && (
                <button className="px-4 py-2 border rounded-full text-sm text-gray-500 hover:border-[#7C6CF2] hover:text-[#7C6CF2] transition-all" onClick={BACK[view]}>
                    ← Back
                </button>
            )}
            <button className="px-4 py-2 border rounded-full text-sm text-gray-500 hover:border-[#E8845A] hover:text-[#E8845A] transition-all" onClick={() => go("input")}>
                New Session
            </button>
        </div>
      </div>

      {/* Progress rail (hidden on input screen) */}
      {showRail && <ProgressRail view={view} />}

      {/* Page shell — debate gets fixed-height no-scroll layout */}
      <div className={`page-shell${isDebate ? " debate-shell" : ""}`}>
        {view === "input" && (
          <InputScreen key={key} onNext={(n) => go("notes", { notes: n })} />
        )}
        {view === "notes" && notes && (
          <NotesScreen
            key={key}
            notes={notes}
            onNext={() => go("explain")}
            onNextDebate={() => go("debate")}
          />
        )}
        {view === "explain" && notes && (
          <ExplainScreen key={key} notes={notes} onNext={() => go("debate")} />
        )}
        {view === "debate" && notes && (
          <DebateScreen key={key} notes={notes} onScore={(s) => go("score", { scores: s })} />
        )}
        {view === "score" && scores && notes && (
          <ScoreScreen
            key={key}
            scores={scores}
            notes={notes}
            onDebateAgain={() => go("debate")}
          />
        )}
      </div>
    </div>
  );
}
