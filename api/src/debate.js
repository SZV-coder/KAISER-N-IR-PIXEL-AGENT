import { askMind } from "./minds.js";
import { decide } from "./verdict.js";

/** Used when the question arrives with no options of its own. */
export const DEFAULT_OPTIONS = ["Do it now", "Wait and learn more first", "Don't do it"];

export async function runDebate(input) {
  const options = Array.isArray(input?.options)
    ? input.options.map((o) => String(o).trim()).filter(Boolean).slice(0, 6)
    : [];
  const req = { ...input, options: options.length ? options : DEFAULT_OPTIONS };
  const stakes = ["low", "medium", "high"].includes(req.stakes) ? req.stakes : "medium";
  // Blind openings: both minds run in parallel and never see each other's answer.
  const [zero, xks] = await Promise.all([
    askMind("Kaiser Zero", req, stakes),
    askMind("XKSÖSEVX", req, stakes),
  ]);
  return { ...decide(req.options, zero, xks, stakes), optionsGenerated: options.length === 0, brain: zero.live && xks.live ? "ai" : zero.live || xks.live ? "partial" : "mock", ...(zero.aiError || xks.aiError ? { aiError: zero.aiError || xks.aiError } : {}) };
}
