# Twin-mind design v0.1

## Kaiser Zero (the anchor)
- Facts, memory, math, source checking
- Risk, cost, privacy, irreversibility
- Asks: "What breaks, and what does it cost?"
- Voice: calm, exact, few words
- Power: safety veto on money, health, legal, and anything sent in the user's name

## XKSÖSEVX (the edge)
- Upside, speed, lateral options
- Brand, style, how the result feels
- Asks: "What's the bold version, and what do we gain?"
- Voice: sharp, fast, a little cocky
- Power: wildcard, always adds one option nobody asked for

## Verdict rules
| Stakes | Zero | XKS |
|---|---|---|
| low | 0.4 | 0.6 |
| medium | 0.5 | 0.5 |
| high | 0.7 | 0.3 |

- High stakes: options Zero vetoes are removed before merging.
- Fact-check loser loses 0.1 weight (reserved for the evidence round).
- Split threshold: 25 points between the minds' top-option scores -> `split: true`, both sides surfaced.
- No options given: the twins debate the defaults "Do it now", "Wait and learn more first", and "Don't do it" (`optionsGenerated: true`).
- Output: verdict, why, dissent, confidence, nextMove.

## On-device mode
- The Android app tries the cloud API first and falls back to OnDeviceTwins.kt, a Kotlin port of the verdict engine plus mock minds, so it works offline. The card then shows "Debated on this phone".

## Hosting and AI (2026-11-08)
- API is live at https://kaiser-noir-twin-mind.vercel.app/api/decide (Vercel project kaiser-noir-twin-mind, deployed with work/tools/deploy-api.sh).
- AI brain: Gemini (gemini-flash-lite-latest) through its OpenAI-compatible endpoint, set by the GEMINI_API_KEY env var in Vercel. Without it the API answers in mock mode (`brain: "mock"`); with it, `brain: "ai"`.
- The app labels each verdict: Live AI · Gemini / Cloud · practice mode / Debated on this phone (offline).
