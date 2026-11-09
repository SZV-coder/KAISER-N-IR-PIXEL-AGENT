export const WEIGHTS = {
  low: { zero: 0.4, xks: 0.6 },
  medium: { zero: 0.5, xks: 0.5 },
  high: { zero: 0.7, xks: 0.3 },
};

export const SPLIT_THRESHOLD = 25;

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

/**
 * Merge two mind opinions into one verdict.
 * Pure function: no I/O, fully unit-tested.
 */
export function decide(options, zero, xks, stakes = "medium") {
  if (options.length === 0) throw new Error("At least one option is required");
  const w = WEIGHTS[stakes];
  const vetoSet = new Set(stakes === "high" ? zero.vetoes : []);

  const scores = options.map((option, i) => {
    const z = clamp(zero.scores[i]);
    const x = clamp(xks.scores[i]);
    return {
      option,
      zero: z,
      xks: x,
      weighted: Math.round((z * w.zero + x * w.xks) * 10) / 10,
      vetoed: vetoSet.has(i),
    };
  });

  const eligible = scores.filter((s) => !s.vetoed);
  if (eligible.length === 0) {
    return {
      verdict: "None of these. Kaiser Zero vetoed every option.",
      why: "Every option was judged unsafe or irreversible at high stakes.",
      dissent: xks.argument,
      confidence: "high",
      nextMove: "Reframe the decision with a safer, reversible option.",
      split: false,
      scores,
      debate: [zero, xks],
    };
  }

  const ranked = [...eligible].sort((a, b) => b.weighted - a.weighted);
  const winner = ranked[0];
  const runnerUp = ranked[1];

  const zeroTop = [...eligible].sort((a, b) => b.zero - a.zero)[0];
  const xksTop = [...eligible].sort((a, b) => b.xks - a.xks)[0];
  const minds_disagree = zeroTop.option !== xksTop.option;
  const gap = Math.abs(winner.zero - winner.xks);
  const split = minds_disagree && gap > SPLIT_THRESHOLD;

  const margin = runnerUp ? winner.weighted - runnerUp.weighted : 100;
  const confidence = split ? "low" : margin >= 20 && gap <= 15 ? "high" : margin >= 8 ? "medium" : "low";

  const loser = winner.zero >= winner.xks ? xks : zero;
  const leader = loser === xks ? zero : xks;

  return {
    verdict: split
      ? `Split decision: Kaiser Zero picks "${zeroTop.option}", XKSÖSEVX picks "${xksTop.option}". Your call.`
      : winner.option,
    why: leader.argument,
    dissent: `${loser.mind}: ${loser.strike || loser.argument}`,
    confidence,
    nextMove: split
      ? "Choose a side, or ask the twins for a hybrid."
      : `Take the first concrete step toward: ${winner.option}.`,
    split,
    scores,
    debate: [zero, xks],
  };
}
