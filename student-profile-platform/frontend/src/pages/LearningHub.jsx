import { useState, useEffect, useRef, useCallback } from "react";

// ── CONSTANTS & MOCK DATA ──────────────────────────────────────────────────
const SAMPLE = `Today we're covering Newton's three laws of motion.
The First Law (Inertia): an object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force.
The Second Law: F = ma. Force equals mass times acceleration. A heavier object requires more force to achieve the same acceleration as a lighter one.
The Third Law: For every action there is an equal and opposite reaction. When a rocket expels gas downward, the reaction pushes it upward.
These three laws form the foundation of classical mechanics and are essential in engineering, space travel, and everyday physics.`;

const VIEWS = ["input", "notes", "explain", "debate", "score"];

const RAIL = [
  { label: "Add Lecture",  icon: "📝" },
  { label: "Study Notes",  icon: "🧩" },
  { label: "Explain Back", icon: "💬" },
  { label: "Debate Mode",  icon: "⚡" },
  { label: "Score",        icon: "📊" },
];

const QREPS = [
  "Why do you think that?",
  "What if this changes?",
  "Can you give an example?",
  "What evidence supports that?",
  "What's the counter-argument?",
];

const OPENINGS = [
  "Let's think this through. What's the most important idea from your notes — and why does it matter?",
  "I'm curious — what are you most confident about after reading those notes? Start there, let's dig in.",
  "Before we start, what felt a little fuzzy in your notes? That's usually the richest place to question.",
];

const MICONS = {
  "Lacks Clarity":          "🌫️",
  "Missing Step":           "🔗",
  "Weak Understanding":     "💭",
  "Cause-Effect Confusion": "🔄",
  "Incomplete Definition":  "📝",
};

const DIMS = [
  { key: "clarity",       label: "Clarity",       icon: "🗣️", desc: "How clearly you expressed ideas",  bg: "rgba(124,108,242,0.09)", a: "#7C6CF2", b: "#9D8FF5" },
  { key: "logic",         label: "Logic",         icon: "🔗", desc: "How well you connected reasoning", bg: "rgba(93,173,226,0.09)",  a: "#5DADE2", b: "#82C4ED" },
  { key: "understanding", label: "Understanding", icon: "💡", desc: "How deeply you grasped concepts",  bg: "rgba(76,175,80,0.09)",   a: "#4CAF50", b: "#74C97A" },
];

const LOAD_MSGS = [
  "Reading your lecture…",
  "Identifying key concepts…",
  "Structuring your notes…",
  "Adding clear explanations…",
  "Almost ready…",
];

const ts = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// ── PARSE & FORMAT UTILITIES ──────────────────────────────────────────────
function rc(t) {
  const m = t.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
  return m ? (
    <>
      <strong>{m[1]}</strong>
      {m[2] ? `: ${m[2]}` : ""}
    </>
  ) : t;
}

function gcn(t) {
  const m = t.match(/^\*\*(.+?)\*\*/);
  return m ? m[1] : t.slice(0, 30) + (t.length > 30 ? "…" : "");
}

// ── API HANDLERS ───────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || '/api';
const PROXY_URL = API_URL.endsWith('/api') ? `${API_URL}/learning/chat` : `${API_URL}/api/learning/chat`;
const UPLOAD_URL = API_URL.endsWith('/api') ? `${API_URL}/learning/upload` : `${API_URL}/api/learning/upload`;

async function ai(sys, user) {
  const r = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { maxOutputTokens: 2000, temperature: 0.4 },
    }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function aiH(sys, hist) {
  const contents = hist.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const r = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys }] },
      contents,
      generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
    }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

const parse = (raw) => {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON found");
    const jsonStr = raw.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("AI Parse Error:", e, "Raw:", raw);
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }
};

async function generateNotes(t) {
  return parse(
    await ai(
      `You are a helpful study assistant. Return ONLY valid JSON with no markdown fences, no extra text:
{"title":"string","summary":"string","keyConcepts":["**Term**: explanation"],"explanations":[{"term":"string","definition":"string"}],"highlights":["string"]}
Rules: keyConcepts must have 4-7 items each starting with **Bold**: explanation. explanations must have 3-5 items. highlights must have 3-5 items. Write in warm, clear, student-friendly language.`,
      `Convert this lecture into structured notes:\n\n${t}`
    )
  );
}

async function checkExplanation(c, u, ctx) {
  return ai(
    `You are Mellow, a warm and encouraging study companion. Your tone is gentle, never harsh. Write 3-5 flowing prose sentences. First, genuinely acknowledge what the student got right. Then softly mention any gap. End with one open question that invites deeper thinking. No bullet points.`,
    `Lecture notes:\n${ctx}\n\nConcept being explained: "${c}"\nStudent's explanation: "${u}"`
  );
}

async function analyzeThinking(c, u, ctx) {
  return parse(
    await ai(
      `Analyze the student's explanation. Return ONLY valid JSON:
{"score":75,"scoreLabel":"Good","mistakes":[{"type":"Lacks Clarity","title":"short title","description":"supportive sentence","hint":"one suggestion"}]}
scoreLabel: Excellent/Good/Developing/Needs Work. Max 3 mistakes.`,
      `Concept: "${c}"\nStudent explanation: "${u}"`
    )
  );
}

async function debateReply(hist, ctx) {
  return aiH(
    `You are Mellow, a calm Socratic companion. Your goal: help students think more deeply. Each reply must: 1) warmly acknowledge something specific they said, 2) ask ONE curious question that pushes their thinking further. Never give answers. Stay warm and conversational — 2-3 sentences max. Topic context:\n${ctx}`,
    hist
  );
}

async function scoreThinking(transcript, ctx) {
  return parse(
    await ai(
      `You are Mellow, a warm learning coach. Score the student's debate responses. Return ONLY valid JSON with no markdown:
{"clarity":7,"logic":6,"understanding":8,"clarityFeedback":"One specific sentence about clarity.","logicFeedback":"One specific sentence about logic.","understandingFeedback":"One specific sentence about understanding.","overallFeedback":"Two or three warm sentences: start with a genuine strength, mention one area to grow, end encouragingly.","nextSteps":["Specific actionable suggestion 1","Specific actionable suggestion 2","Specific actionable suggestion 3"]}
Scoring: 9-10 exceptional, 7-8 strong, 5-6 developing, 3-4 basic, 0-2 minimal. Be warm and constructive.`,
      `Topic context:\n${ctx}\n\nStudent's debate responses:\n${transcript}`
    )
  );
}

// ── COMPONENT WIDGETS ───────────────────────────────────────────────────────
function ProgressRail({ view }) {
  const cur = VIEWS.indexOf(view === "loading" ? "notes" : view);

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/50 dark:border-slate-800/80 py-3 flex items-center justify-center gap-1 sm:gap-4 overflow-x-auto">
      {RAIL.map((s, i) => {
        const done   = i < cur;
        const active = i === cur;
        return (
          <div className="flex items-center gap-1 sm:gap-2" key={s.label}>
            {i > 0 && (
              <div className="w-8 sm:w-16 h-0.5 bg-slate-200 dark:bg-slate-800 rounded">
                <div className={`h-full bg-emerald-500 transition-all duration-500 ${done ? 'w-full' : 'w-0'}`} />
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                active 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                  : done 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold whitespace-nowrap ${
                active 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : done 
                    ? 'text-emerald-500' 
                    : 'text-slate-400 dark:text-slate-500'
              }`}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SRing({ score, label }) {
  const r   = 20;
  const c   = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const col = score >= 75 ? "#10B981" : score >= 45 ? "#6366F1" : "#F97316";

  const msgs = {
    Excellent:    "Solid thinking.",
    Good:         "Good — a few things to sharpen.",
    Developing:   "On the right track.",
    "Needs Work": "Good starting point.",
  };

  return (
    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-800 p-4 rounded-2xl w-full sm:w-auto">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 52 52">
          <circle className="text-slate-200 dark:text-slate-800" strokeWidth="3" stroke="currentColor" fill="transparent" r={r} cx="26" cy="26" />
          <circle
            className="transition-all duration-1000"
            strokeWidth="3.5"
            stroke={col}
            strokeDasharray={c}
            strokeDashoffset={off}
            strokeLinecap="round"
            fill="transparent"
            r={r}
            cx="26"
            cy="26"
          />
        </svg>
        <div className="absolute text-sm font-black text-slate-800 dark:text-slate-100">{score}</div>
      </div>
      <div>
        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {score >= 75 ? "🌟" : score >= 45 ? "💪" : "🌱"} {label}
        </h4>
        <p className="text-[10px] text-slate-400 mt-0.5">{msgs[label] || "Keep going."}</p>
      </div>
    </div>
  );
}

function ABar({ pct, from, to, delay = 0 }) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setW(pct), 80 + delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{
          width: `${w}%`,
          background: `linear-gradient(90deg,${from},${to})`,
        }}
      />
    </div>
  );
}

// ── SCREEN VIEW COMPONENTS ──────────────────────────────────────────────────
function InputScreen({ onNext }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const fileRef = useRef(null);

  const wc = text.trim() ? text.trim().split(/\s+/).length : 0;
  const canGo = text.trim().length > 20 && !loading;

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    setLoadStep(0);
    const t = setInterval(() => {
      i = Math.min(i + 1, LOAD_MSGS.length - 1);
      setLoadStep(i);
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
    } catch (e) {
      setErr(e.message || "Couldn't generate notes. Please try again.");
      setLoading(false);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setExtracting(true);
    setErr("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const r = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
      });
      
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to extract text from file");
      }
      
      const d = await r.json();
      setText(d.text);
    } catch (e) {
      setErr(e.message || "Couldn't read file. Try pasting the text instead.");
    } finally {
      setExtracting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center animate-reveal">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Structuring Study Notes</h2>
          <p className="text-xs text-slate-400 mt-1">{LOAD_MSGS[loadStep]}</p>
        </div>
        <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${((loadStep + 1) / LOAD_MSGS.length) * 100}%` }} />
        </div>
        <div className="flex flex-col gap-2 mt-4 text-left w-full max-w-sm px-4">
          {LOAD_MSGS.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 transition-opacity duration-300 ${i <= loadStep ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${
                i < loadStep ? 'bg-emerald-500' : i === loadStep ? 'bg-indigo-600 animate-ping' : 'bg-slate-300 dark:bg-slate-700'
              }`} />
              <span className={`text-xs ${i === loadStep ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-reveal max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
          ✨ Lecture Input
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Drop your <span className="text-indigo-600 dark:text-indigo-400 italic font-serif">lecture.</span> We'll study it.
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg mx-auto">
          Paste any transcript, notes, or copy-paste text. Mellow turns it into beautifully structured study summaries.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col gap-4">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
          <span>LECTURE TEXT</span>
          {wc > 0 && <span>{wc} words</span>}
        </div>

        <textarea
          className="w-full h-48 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
          placeholder="Paste lecture content, book paragraphs, or video transcript..."
          value={text}
          onChange={(e) => { setText(e.target.value); setErr(""); }}
        />

        <div className="flex items-center my-2 text-xs font-bold text-slate-400">
          <div className="flex-grow h-px bg-slate-100 dark:bg-slate-800" />
          <span className="px-3">OR UPLOAD FILE</span>
          <div className="flex-grow h-px bg-slate-100 dark:bg-slate-800" />
        </div>

        <button
          className="border-2 border-dashed border-slate-202 dark:border-slate-800 hover:border-indigo-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 transition-colors cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {extracting ? "Extracting text..." : "Click to browse or drag file (.pdf, .docx, .txt)"}
          </span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${wc > 10 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            {wc < 10 ? "Requires at least a few sentences" : "Lecture loaded and ready!"}
          </div>
          <button
            onClick={go}
            disabled={!canGo}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Generate Study Notes
          </button>
        </div>
      </div>

      {err && <div className="mt-4 px-4 py-3 rounded-xl border border-red-200/50 bg-red-50/50 text-red-600 text-xs font-semibold">{err}</div>}

      <div className="flex justify-center gap-4 mt-6 flex-wrap">
        {!text && (
          <button
            onClick={() => setText(SAMPLE)}
            className="px-3.5 py-1.5 border border-slate-202 dark:border-slate-800 rounded-full text-xs font-semibold text-slate-500 hover:bg-indigo-50/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            ✨ Try a sample lecture
          </button>
        )}
      </div>
    </div>
  );
}

function NotesScreen({ notes, onNext, onNextDebate }) {
  const handleCopy = () => {
    const t =
      `# ${notes.title}\n\n` +
      `## Summary\n${notes.summary}\n\n` +
      `## Key Concepts\n${notes.keyConcepts.map((c) => `• ${c}`).join("\n")}\n\n` +
      `## Explanations\n${notes.explanations.map((e) => `**${e.term}**: ${e.definition}`).join("\n")}\n\n` +
      `## Highlights\n${notes.highlights.map((h) => `★ ${h}`).join("\n")}`;
    navigator.clipboard.writeText(t).then(() => alert("Copied to clipboard!")).catch(() => {});
  };

  return (
    <div className="animate-reveal flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-500">YOUR STUDY NOTES</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 italic font-serif leading-none mt-1">
            {notes.title}
          </h1>
        </div>
        <button onClick={handleCopy} className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
          📋 Copy Notes
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📖</span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Overview</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-light">{notes.summary}</p>
        </div>

        {/* Key Concepts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧩</span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Key Concepts</h3>
          </div>
          <div className="flex flex-col gap-3">
            {notes.keyConcepts.map((c, i) => (
              <div className="flex items-start gap-2.5" key={i}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rc(c)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Explanations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💡</span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Explanations</h3>
          </div>
          <div className="flex flex-col gap-4">
            {notes.explanations.map((e, i) => (
              <div className="border-l-2 border-indigo-500 pl-3 py-0.5" key={i}>
                <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400">{e.term}</h4>
                <p className="text-xs text-slate-505 dark:text-slate-400 mt-1 leading-relaxed">{e.definition}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⭐</span>
            <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">Key Highlights</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {notes.highlights.map((h, i) => (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 text-xs rounded-xl font-medium" key={i}>
                ★ {h}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Strip */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl shadow-indigo-900/10">
        <div>
          <h3 className="text-lg font-bold">Ready to test your thinking?</h3>
          <p className="text-xs text-indigo-200 mt-1">Explain the key concepts in your own words, or jump straight into the debate mode.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={onNext} className="flex-1 md:flex-initial px-5 py-3 rounded-xl bg-white text-indigo-950 hover:bg-slate-100 font-bold text-sm transition-colors cursor-pointer text-center">
            Explain Back
          </button>
          <button onClick={onNextDebate} className="flex-1 md:flex-initial px-5 py-3 rounded-xl bg-indigo-800 hover:bg-indigo-700 border border-indigo-700 text-white font-bold text-sm transition-colors cursor-pointer text-center">
            ⚡ Debate
          </button>
        </div>
      </div>
    </div>
  );
}

function ExplainScreen({ notes, onNext }) {
  const [sel, setSel] = useState(0);
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [fb, setFb] = useState("");
  const [an, setAn] = useState(null);
  const [err, setErr] = useState("");
  const ta = useRef(null);

  const concept = notes.keyConcepts[sel];
  const name = gcn(concept);
  const min = 40;
  const pct = Math.min((text.length / min) * 100, 100);
  const can = text.trim().length >= min && !checking;

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
    <div className="animate-reveal flex flex-col gap-6">
      <div className="text-center mb-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
          💬 Explain Back
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight">Put it in your <span className="text-indigo-600 dark:text-indigo-400 italic font-serif">own words.</span></h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Pick a concept tab, write your explanation, and get kind suggestions on your logic gaps.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 border-b border-slate-100 dark:border-slate-800">
        {notes.keyConcepts.map((c, i) => (
          <button
            key={i}
            onClick={() => setSel(i)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              sel === i 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' 
                : 'bg-white dark:bg-slate-900 border border-slate-202/50 dark:border-slate-800 text-slate-505 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {gcn(c)}
          </button>
        ))}
      </div>

      {/* Reference Card */}
      <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/80 p-4 rounded-xl">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">📖 CONTEXT FROM LECTURE</span>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-light">{rc(concept)}</p>
      </div>

      {/* Input Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-5 shadow-lg shadow-slate-100/20 dark:shadow-none relative">
        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">Explain "{name}"</h3>
        <textarea
          ref={ta}
          disabled={checking}
          className="w-full h-32 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed"
          placeholder="Write your explanation here..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (fb) { setFb(""); setAn(null); }
          }}
        />

        <div className="flex justify-between items-center mt-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <span className={`font-semibold ${text.length >= min ? 'text-emerald-500' : 'text-slate-400'}`}>
              {text.length >= min ? "✓ Ready" : `${text.length} / ${min}`}
            </span>
          </div>
          {text.length > 0 && (
            <button onClick={retry} className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer">
              Clear
            </button>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 gap-4">
          <span className="text-[10px] text-slate-400">💡 Tip: Avoid copied phrasing to build true memory</span>
          <button
            onClick={check}
            disabled={!can}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition-colors cursor-pointer"
          >
            {checking ? "Checking..." : "Check Explanation"}
          </button>
        </div>

        {checking && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[2px] rounded-3xl flex items-center justify-center gap-3">
            <svg className="w-5 h-5 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
            </svg>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Evaluating your thinking...</span>
          </div>
        )}
      </div>

      {err && <div className="px-4 py-3 rounded-xl border border-red-200/50 bg-red-50/50 text-red-600 text-xs font-semibold">{err}</div>}

      {/* Results */}
      {(fb || an) && (
        <div className="animate-reveal bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-3xl shadow-lg flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            {an && <SRing score={an.score} label={an.scoreLabel} />}
            {fb && (
              <div className="flex-1 bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-indigo-600">✦</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Mellow's KIND FEEDBACK</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">{fb}</p>
              </div>
            )}
          </div>

          {an && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Thinking Patterns</h4>
              {an.mistakes?.length === 0 ? (
                <div className="flex items-center gap-3 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/50 p-4 rounded-xl">
                  <span className="text-xl">🎯</span>
                  <div>
                    <h5 className="font-bold text-xs text-emerald-800 dark:text-emerald-400">Excellent Logic!</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-light">No structural gaps or definitions errors detected in your explanation.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {an.mistakes.map((m, i) => (
                    <div className="flex gap-3 bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100/30 dark:border-amber-900/20 p-4 rounded-xl" key={i}>
                      <span className="text-lg flex-shrink-0 mt-0.5">{MICONS[m.type] || "⚠️"}</span>
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase block tracking-wider">{m.type}</span>
                        <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 mt-1">{m.title}</h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-light leading-relaxed">{m.description}</p>
                        {m.hint && <p className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold mt-2">💡 Tip: {m.hint}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button onClick={retry} className="px-4 py-2 border border-slate-202 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 cursor-pointer">
              Try Again ↺
            </button>
            {sel < notes.keyConcepts.length - 1 ? (
              <button onClick={() => setSel((i) => i + 1)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer ml-auto">
                Next Concept →
              </button>
            ) : (
              <button onClick={onNext} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer ml-auto">
                Enter Debate Hub ⚡
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DebateScreen({ notes, onScore }) {
  const ctx = `Title: ${notes.title}\nSummary: ${notes.summary}\nKey Concepts:\n${notes.keyConcepts.join("\n")}`;

  const [msgs, setMsgs] = useState([{ role: "assistant", content: OPENINGS[Math.floor(Math.random() * 3)], time: ts() }]);
  const [inp, setInp] = useState("");
  const [typing, setTyping] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [err, setErr] = useState("");
  const [showQR, setShowQR] = useState(true);

  const bot = useRef(null);
  const inpRef = useRef(null);

  const userMsgs = msgs.filter((m) => m.role === "user");
  const umc = userMsgs.length;
  const canScore = umc >= 3;

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
      const um = { role: "user", content: text, time: ts() };
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

  if (scoring) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center animate-reveal">
        <div className="w-16 h-16 rounded-full bg-indigo-600 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Analyzing Your Thinking</h2>
          <p className="text-xs text-slate-400 mt-1">Grading {umc} responses on Clarity, Logic, and Comprehension...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-reveal flex flex-col flex-1 bg-white dark:bg-slate-900 border border-slate-202/50 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden h-[460px] sm:h-[520px]">
      {/* Topic Header */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20 gap-3">
        <div className="flex items-center gap-2 truncate">
          <span className="text-base flex-shrink-0">⚡</span>
          <div className="truncate">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider leading-none">DEBATE HUB</h4>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate block mt-1">{notes.title}</span>
          </div>
        </div>
        <button
          onClick={doScore}
          disabled={!canScore || typing}
          className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold shadow-sm transition-colors cursor-pointer whitespace-nowrap ${
            canScore 
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}
        >
          {canScore ? "📊 Score Debate" : `${3 - umc} more required`}
        </button>
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
        {msgs.map((m, i) => (
          <div key={i} className={`flex items-start gap-3 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              m.role === 'user' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600' : 'bg-indigo-500 text-white'
            }`}>
              {m.role === 'user' ? "🙋" : "✦"}
            </div>
            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-200/20 dark:border-none'
            }`}>
              {m.content}
              <div className={`text-[8px] text-right mt-1.5 block opacity-50 ${m.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>{m.time}</div>
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-start gap-3 max-w-[80%] self-start animate-pulse">
            <div className="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">✦</div>
            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none text-slate-400 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200" />
            </div>
          </div>
        )}

        {err && <div className="self-center bg-red-50 text-red-600 text-[10px] px-3 py-1.5 rounded-lg font-semibold">{err}</div>}
        <div ref={bot} />
      </div>

      {/* Suggested replies */}
      {showQR && !typing && msgs[msgs.length - 1]?.role === 'assistant' && (
        <div className="px-5 py-2 flex gap-1.5 overflow-x-auto border-t border-slate-100 dark:border-slate-800 bg-slate-50/20">
          {QREPS.slice(0, 3).map((q, i) => (
            <button
              key={i}
              onClick={() => send(q)}
              className="px-3 py-1 border border-slate-202 dark:border-slate-800 rounded-full text-[10px] font-semibold text-slate-500 hover:border-indigo-500 hover:text-indigo-600 whitespace-nowrap cursor-pointer transition-colors bg-white dark:bg-slate-900"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex gap-2 items-center">
          <textarea
            ref={inpRef}
            rows={1}
            disabled={typing}
            placeholder="Share your perspective..."
            value={inp}
            onChange={(e) => setInp(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            className="flex-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-202 dark:border-slate-800/80 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
          />
          <button
            onClick={() => send()}
            disabled={!inp.trim() || typing}
            className="p-2.5 rounded-xl bg-indigo-600 text-white disabled:opacity-40 transition-opacity cursor-pointer shadow-md shadow-indigo-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-1">
          <span>Enter to send · Shift+Enter for new line</span>
          {canScore && <span className="font-bold text-emerald-500">📊 Ready to score</span>}
        </div>
      </div>
    </div>
  );
}

function ScoreScreen({ scores, notes, onDebateAgain }) {
  const total = Math.round(((scores.clarity + scores.logic + scores.understanding) / 3) * 10) / 10;
  const lbl = total >= 8 ? "Exceptional" : total >= 6 ? "Strong" : total >= 4 ? "Developing" : "Building";
  const em = total >= 8 ? "🌟" : total >= 6 ? "💪" : total >= 4 ? "🌱" : "🔥";

  return (
    <div className="animate-reveal flex flex-col gap-6">
      {/* Orb Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-3xl p-6 shadow-lg text-center flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center leading-none">
            <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{total.toFixed(1)}</span>
            <span className="text-[9px] font-bold text-slate-400 block mt-1">OUT OF 10</span>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{em} {lbl} Thinking</h2>
          <p className="text-xs text-slate-400 mt-1">Based on evaluation of debate responses on "{notes.title}".</p>
        </div>
      </div>

      {/* Dimension Bars */}
      <div className="grid grid-cols-1 gap-4">
        {DIMS.map((d, i) => {
          const s = scores[d.key];
          const fk = d.key + "Feedback";
          const pct = (s / 10) * 100;
          const col = s >= 8 ? "text-emerald-500" : s >= 5 ? "text-indigo-600 dark:text-indigo-400" : "text-orange-500";
          return (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-4 rounded-2xl shadow-sm" key={d.key}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{d.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">{d.label}</h4>
                    <p className="text-[10px] text-slate-400 font-light">{d.desc}</p>
                  </div>
                </div>
                <div>
                  <span className={`text-base font-bold ${col}`}>{s}</span>
                  <span className="text-[10px] text-slate-400">/10</span>
                </div>
              </div>
              <ABar pct={pct} from={d.a} to={d.b} delay={i * 110} />
              {scores[fk] && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-light leading-relaxed">{scores[fk]}</p>}
            </div>
          );
        })}
      </div>

      {/* Overall feedback */}
      <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-indigo-600">✦</span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Mellow's Coach Summary</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-light">{scores.overallFeedback}</p>
      </div>

      {/* Next steps */}
      {scores.nextSteps?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Suggested Next Steps</h4>
          <div className="flex flex-col gap-3">
            {scores.nextSteps.map((s, i) => (
              <div className="flex gap-3" key={i}>
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <button onClick={onDebateAgain} className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer text-center">
          ⚡ Debate Again
        </button>
        <button onClick={() => window.location.reload()} className="flex-1 px-4 py-3 border border-slate-202 dark:border-slate-800 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors cursor-pointer text-center">
          New Lecture
        </button>
      </div>
    </div>
  );
}

// ── MAIN HUB CONTAINER ──────────────────────────────────────────────────────
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

  const BACK = {
    notes:   () => go("input"),
    explain: () => go("notes"),
    debate:  () => go("notes"),
    score:   () => go("debate"),
  };

  const isDebate = view === "debate";
  const showRail = view !== "input";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 relative overflow-hidden">
      {/* Background ambient light blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sticky Inner Navigation Bar */}
      <div className="flex justify-between items-center px-6 py-4 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-[100] border-b border-slate-100 dark:border-slate-800/80">
        <div className="text-xl font-bold cursor-pointer hover:opacity-70 transition-all" onClick={() => go("input")}>
          <span className="text-indigo-600 dark:text-indigo-400">Mellow</span> Hub
        </div>
        <div className="flex gap-4">
          {BACK[view] && (
            <button className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500 dark:hover:border-indigo-400 dark:hover:text-indigo-400 transition-all cursor-pointer" onClick={BACK[view]}>
              ← Back
            </button>
          )}
          <button className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-semibold text-slate-500 dark:text-slate-400 hover:border-orange-500 hover:text-orange-600 dark:hover:border-orange-400 dark:hover:text-orange-400 transition-all cursor-pointer" onClick={() => go("input")}>
            New Session
          </button>
        </div>
      </div>

      {/* Progress rail */}
      {showRail && <ProgressRail view={view} />}

      {/* Screen container */}
      <div className={`max-w-4xl mx-auto px-6 py-8 ${isDebate ? "h-[calc(100vh-140px)] flex flex-col overflow-hidden" : ""}`}>
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
