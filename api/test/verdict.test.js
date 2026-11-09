import { test } from "node:test";
import assert from "node:assert/strict";
import { decide } from "../src/verdict.js";
import { mockMind } from "../src/minds.js";
import { runDebate } from "../src/debate.js";

const op = (mind, scores, vetoes = []) => ({
  mind,
  scores,
  vetoes,
  argument: `${mind} argues`,
  steelman: "fair point",
  strike: `${mind} strikes`,
});

const OPTIONS = ["Public launch Saturday", "Wait two weeks", "Soft launch to 10 testers"];

test("hybrid wins when both minds rate it well", () => {
  const v = decide(OPTIONS, op("Kaiser Zero", [35, 75, 80]), op("XKSÖSEVX", [85, 40, 78]), "medium");
  assert.equal(v.verdict, "Soft launch to 10 testers");
  assert.equal(v.split, false);
});

test("stakes shift the weights", () => {
  const zero = op("Kaiser Zero", [30, 80]);
  const xks = op("XKSÖSEVX", [95, 45]);
  assert.equal(decide(["Bold", "Safe"], zero, xks, "low").scores[0].weighted, 69);
  assert.equal(decide(["Bold", "Safe"], zero, xks, "high").verdict.startsWith("Split"), true);
});

test("Kaiser Zero veto only applies on high stakes", () => {
  const zero = op("Kaiser Zero", [60, 50], [0]);
  const xks = op("XKSÖSEVX", [90, 50]);
  assert.equal(decide(["Risky", "Fine"], zero, xks, "medium").verdict, "Risky");
  const high = decide(["Risky", "Fine"], zero, xks, "high");
  assert.equal(high.verdict, "Fine");
  assert.equal(high.scores[0].vetoed, true);
});

test("all options vetoed returns a reframe", () => {
  const v = decide(["A"], op("Kaiser Zero", [10], [0]), op("XKSÖSEVX", [90]), "high");
  assert.match(v.verdict, /vetoed every option/);
});

test("split decision when minds disagree by more than 25", () => {
  const v = decide(["Bold", "Safe"], op("Kaiser Zero", [20, 90]), op("XKSÖSEVX", [95, 30]), "medium");
  assert.equal(v.split, true);
  assert.equal(v.confidence, "low");
});

test("scores are clamped to 0-100", () => {
  const v = decide(["A"], op("Kaiser Zero", [150]), op("XKSÖSEVX", [-20]), "medium");
  assert.equal(v.scores[0].zero, 100);
  assert.equal(v.scores[0].xks, 0);
});

test("mock XKSÖSEVX always brings a wildcard", () => {
  const m = mockMind("XKSÖSEVX", { question: "q", options: ["Go now", "Wait"] });
  assert.ok(m.wildcard);
});

test("full debate runs offline with no API key", async () => {
  delete process.env.OPENAI_API_KEY;
  const v = await runDebate({ question: "Launch?", options: OPTIONS, stakes: "medium" });
  assert.ok(v.verdict.length > 0);
  assert.equal(v.debate.length, 2);
});

test("a question with no options gets default options instead of crashing", async () => {
  const v = await runDebate({ question: "Should I buy a used tablet?" });
  assert.equal(v.scores.length, 3);
  assert.equal(v.optionsGenerated, true);
  assert.ok(typeof v.verdict === "string" && v.verdict.length > 0);
});
