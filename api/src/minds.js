export const PERSONAS = {
  "Kaiser Zero":
    "You are Kaiser Zero, the anchor half of the K∆iiSER NØIR BL∆CK TUX twin-mind agent. " +
    "You weigh facts, memory, risk, cost, privacy and reversibility. You ask: what breaks, and what does it cost? " +
    "Calm, exact, few words. On high-stakes decisions you may veto options that are unsafe or irreversible.",
  XKSÖSEVX:
    "You are XKSÖSEVX, the edge half of the K∆iiSER NØIR BL∆CK TUX twin-mind agent. " +
    "You chase upside, speed, creativity, style and brand. You ask: what's the bold version, and what do we gain? " +
    "Sharp, fast, a little cocky. You must always propose one wildcard option nobody asked for.",
};

function prompt(mind, req, stakes) {
  return [
    `Decision: ${req.question}`,
    req.context ? `Context: ${req.context}` : "",
    `Stakes: ${stakes}`,
    "Options:",
    ...req.options.map((o, i) => `${i}. ${o}`),
    "",
    "Reply with JSON only:",
    `{"scores":[0-100 per option in order],"argument":"one line","steelman":"the other mind's best case, fairly","strike":"your attack on it","vetoes":[option indexes${mind === "Kaiser Zero" ? " you veto, high stakes only" : ", always []"}],"wildcard":"${mind === "XKSÖSEVX" ? "one extra option" : ""}"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Offline mind: deterministic, so the app works with no API key. */
export function mockMind(mind, req) {
  const n = req.options.length;
  const isZero = mind === "Kaiser Zero";
  // Zero favors later / more cautious-sounding options, XKS favors earlier / bolder ones.
  const cautious = /wait|later|test|safe|save|soft|small|pilot/i;
  const scores = req.options.map((o, i) => {
    const base = isZero
      ? 40 + Math.round((i / Math.max(1, n - 1)) * 30)
      : 80 - Math.round((i / Math.max(1, n - 1)) * 30);
    const lean = cautious.test(o) ? (isZero ? 15 : -10) : isZero ? -5 : 10;
    return Math.max(0, Math.min(100, base + lean));
  });
  return {
    mind,
    scores,
    argument: isZero
      ? "Protect the downside first. The option that can be undone wins ties."
      : "Momentum compounds. Move now and learn from real feedback.",
    steelman: isZero ? "Speed does create real feedback." : "A bad first impression is hard to undo.",
    strike: isZero
      ? "Feedback from a broken experience is noise."
      : "So make the first move small, not slow.",
    vetoes: [],
    wildcard: isZero ? undefined : `Pilot "${req.options[0]}" with a small group first`,
  };
}

/** Ask one mind via an OpenAI-compatible chat API. Falls back to the mock on any failure. */
export async function askMind(mind, req, stakes) {
  // Gemini (via its OpenAI-compatible endpoint) when GEMINI_API_KEY is set, otherwise any OpenAI-compatible API.
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const key = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return mockMind(mind, req);
  const baseUrl = process.env.OPENAI_BASE_URL ??
    (gemini ? "https://generativelanguage.googleapis.com/v1beta/openai" : "https://api.openai.com/v1");
  const model = process.env.OPENAI_MODEL ?? (gemini ? "gemini-flash-lite-latest" : "gpt-4o-mini");
  try {
    const call = () => fetch(
      `${baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(12_000),
        body: JSON.stringify({
          model,
          ...(gemini ? { reasoning_effort: "low" } : {}),
          response_format: { type: "json_object" },
          temperature: mind === "XKSÖSEVX" ? 0.9 : 0.2,
          messages: [
            { role: "system", content: PERSONAS[mind] },
            { role: "user", content: prompt(mind, req, stakes) },
          ],
        }),
      },
    );
    // Gemini sometimes answers 429/503 under load: retry once with a short backoff.
    let res = await call();
    for (let attempt = 1; attempt <= 1 && (res.status === 429 || res.status >= 500); attempt++) {
      await new Promise((r) => setTimeout(r, 1200 * attempt));
      res = await call();
    }
    if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}");
    return {
      mind,
      live: true,
      scores: Array.isArray(parsed.scores) ? parsed.scores.map(Number) : req.options.map(() => 50),
      argument: String(parsed.argument ?? ""),
      steelman: String(parsed.steelman ?? ""),
      strike: String(parsed.strike ?? ""),
      vetoes: Array.isArray(parsed.vetoes) ? parsed.vetoes.map(Number) : [],
      wildcard: parsed.wildcard ? String(parsed.wildcard) : undefined,
    };
  } catch (e) {
    return { ...mockMind(mind, req), aiError: String(e?.message ?? e).slice(0, 240) };
  }
}
