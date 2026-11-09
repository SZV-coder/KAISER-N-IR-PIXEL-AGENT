import { runDebate } from "../src/debate.js";

const STAKES = ["low", "medium", "high"];

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const question = String(body.question ?? "").trim();
  const options = Array.isArray(body.options) ? body.options.map(String).filter(Boolean).slice(0, 6) : [];
  const stakes = STAKES.includes(body.stakes) ? body.stakes : "medium";
  if (!question) {
    return Response.json({ error: "Send a question" }, { status: 400 });
  }
  const verdict = await runDebate({ question, options, stakes, context: body.context });
  return Response.json(verdict);
}

export async function GET(request) {
  if (new URL(request.url).searchParams.get("diag") === "models" && process.env.GEMINI_API_KEY) {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/models", {
      headers: { authorization: `Bearer ${process.env.GEMINI_API_KEY}` },
    });
    const j = await r.json().catch(() => ({}));
    return Response.json({ status: r.status, models: (j.data ?? []).map((m) => m.id).filter((id) => /flash|lite/.test(id)) });
  }
  return Response.json({ agent: "K∆iiSER NØIR BL∆CK TUX", minds: ["Kaiser Zero", "XKSÖSEVX"], status: "ok" });
}
