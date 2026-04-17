const API_URL = import.meta.env.VITE_API_URL || '/api';
const PROXY_URL = API_URL.endsWith('/api') ? `${API_URL}/learning/chat` : `${API_URL}/api/learning/chat`;

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
    // Fallback attempt with regex
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  }
};

export async function generateNotes(t) {
  return parse(
    await ai(
      `You are a helpful study assistant. Return ONLY valid JSON with no markdown fences, no extra text:
{"title":"string","summary":"string","keyConcepts":["**Term**: explanation"],"explanations":[{"term":"string","definition":"string"}],"highlights":["string"]}
Rules: keyConcepts must have 4-7 items each starting with **Bold**: explanation. explanations must have 3-5 items. highlights must have 3-5 items. Write in warm, clear, student-friendly language.`,
      `Convert this lecture into structured notes:\n\n${t}`
    )
  );
}

export async function checkExplanation(c, u, ctx) {
  return ai(
    `You are Mellow, a warm and encouraging study companion. Your tone is gentle, never harsh. Write 3-5 flowing prose sentences. First, genuinely acknowledge what the student got right. Then softly mention any gap. End with one open question that invites deeper thinking. No bullet points.`,
    `Lecture notes:\n${ctx}\n\nConcept being explained: "${c}"\nStudent's explanation: "${u}"`
  );
}

export async function analyzeThinking(c, u, ctx) {
  return parse(
    await ai(
      `Analyze the student's explanation. Return ONLY valid JSON:
{"score":75,"scoreLabel":"Good","mistakes":[{"type":"Lacks Clarity","title":"short title","description":"supportive sentence","hint":"one suggestion"}]}
scoreLabel: Excellent/Good/Developing/Needs Work. Max 3 mistakes.`,
      `Concept: "${c}"\nStudent explanation: "${u}"`
    )
  );
}

export async function debateReply(hist, ctx) {
  return aiH(
    `You are Mellow, a calm Socratic companion. Your goal: help students think more deeply. Each reply must: 1) warmly acknowledge something specific they said, 2) ask ONE curious question that pushes their thinking further. Never give answers. Stay warm and conversational — 2-3 sentences max. Topic context:\n${ctx}`,
    hist
  );
}

export async function scoreThinking(transcript, ctx) {
  return parse(
    await ai(
      `You are Mellow, a warm learning coach. Score the student's debate responses. Return ONLY valid JSON with no markdown:
{"clarity":7,"logic":6,"understanding":8,"clarityFeedback":"One specific sentence about clarity.","logicFeedback":"One specific sentence about logic.","understandingFeedback":"One specific sentence about understanding.","overallFeedback":"Two or three warm sentences: start with a genuine strength, mention one area to grow, end encouragingly.","nextSteps":["Specific actionable suggestion 1","Specific actionable suggestion 2","Specific actionable suggestion 3"]}
Scoring: 9-10 exceptional, 7-8 strong, 5-6 developing, 3-4 basic, 0-2 minimal. Be warm and constructive.`,
      `Topic context:\n${ctx}\n\nStudent's debate responses:\n${transcript}`
    )
  );
}
