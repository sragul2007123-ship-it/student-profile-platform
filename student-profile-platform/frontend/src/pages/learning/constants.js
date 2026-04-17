export const SAMPLE = `Today we're covering Newton's three laws of motion.
The First Law (Inertia): an object at rest stays at rest, and an object in motion stays in motion, unless acted upon by an external force.
The Second Law: F = ma. Force equals mass times acceleration. A heavier object requires more force to achieve the same acceleration as a lighter one.
The Third Law: For every action there is an equal and opposite reaction. When a rocket expels gas downward, the reaction pushes it upward.
These three laws form the foundation of classical mechanics and are essential in engineering, space travel, and everyday physics.`;

export const VIEWS = ["input", "notes", "explain", "debate", "score"];

export const RAIL = [
  { label: "Add Lecture",  icon: "📝" },
  { label: "Study Notes",  icon: "🧩" },
  { label: "Explain Back", icon: "💬" },
  { label: "Debate Mode",  icon: "⚡" },
  { label: "Score",        icon: "📊" },
];

export const QREPS = [
  "Why do you think that?",
  "What if this changes?",
  "Can you give an example?",
  "What evidence supports that?",
  "What's the counter-argument?",
];

export const OPENINGS = [
  "Let's think this through. What's the most important idea from your notes — and why does it matter?",
  "I'm curious — what are you most confident about after reading those notes? Start there, let's dig in.",
  "Before we start, what felt a little fuzzy in your notes? That's usually the richest place to question.",
];

export const MICONS = {
  "Lacks Clarity":          "🌫️",
  "Missing Step":           "🔗",
  "Weak Understanding":     "💭",
  "Cause-Effect Confusion": "🔄",
  "Incomplete Definition":  "📝",
};

export const DIMS = [
  { key: "clarity",       label: "Clarity",       icon: "🗣️", desc: "How clearly you expressed ideas",  bg: "rgba(124,108,242,0.09)", a: "#7C6CF2", b: "#9D8FF5" },
  { key: "logic",         label: "Logic",         icon: "🔗", desc: "How well you connected reasoning", bg: "rgba(93,173,226,0.09)",  a: "#5DADE2", b: "#82C4ED" },
  { key: "understanding", label: "Understanding", icon: "💡", desc: "How deeply you grasped concepts",  bg: "rgba(76,175,80,0.09)",   a: "#4CAF50", b: "#74C97A" },
];

export const ts = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
