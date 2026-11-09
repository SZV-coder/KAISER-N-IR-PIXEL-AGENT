# K∆iiSER NØIR BL∆CK TUX

A twin-mind Pixel AI agent. Two minds argue, one verdict comes out.

| Mind | Role | Strengths | Power |
|---|---|---|---|
| **Kaiser Zero** | The anchor | Facts, memory, risk, cost, reversibility | Safety veto on high-stakes calls |
| **XKSÖSEVX** | The edge | Upside, speed, creativity, brand voice | Must always add one wildcard option |

## Layout

```
api/       Vercel serverless API (Node, ES modules): the twin-mind debate engine
android/   Pixel app (Kotlin + Jetpack Compose) that talks to the API
docs/      Design notes
scripts/   deploy-api.sh (Vercel deploy) and build-apk.sh (debug APK build)
.github/   CI: API tests + Android debug build
```

## How a decision works

1. **Frame**: both minds get the same brief and a stakes level (low / medium / high).
2. **Blind openings**: each mind scores every option 0–100 without seeing the other.
3. **Steelman, then strike**: each states the other's best case, then attacks it.
4. **Merge**: weighted score per stakes level (Zero/XKS): low 40/60, medium 50/50, high 70/30.
5. **Veto**: on high stakes, Zero can block an unsafe or irreversible option.
6. **Split**: if the minds disagree on the winner by more than 25 points, both sides go to you.

Every answer returns: **verdict, why, dissent, confidence, next move**.

## Run the API

```bash
cd api
npm test                 # verdict engine tests (Node 22+)
npx vercel dev           # local API at http://localhost:3000/api/decide
```

Set `GEMINI_API_KEY` (default model `gemini-flash-lite-latest`) or `OPENAI_API_KEY` (default `gpt-4o-mini`; override with `OPENAI_MODEL`) in Vercel to use a real model. Without a key the minds run in offline mock mode so everything still works end to end.

```bash
curl -X POST http://localhost:3000/api/decide \
  -H 'content-type: application/json' \
  -d '{"question":"Launch the beta this weekend?","options":["Launch Saturday","Wait two weeks"],"stakes":"medium"}'
```

## Run the Android app

Live API: `https://kaiser-noir-twin-mind.vercel.app/api/decide` (Gemini).

Open `android/` in Android Studio (Ladybug or newer) and run on your Pixel, or grab the debug APK from the latest CI run's artifacts. The app calls the live API and falls back to an on-device engine (`OnDeviceTwins.kt`) when offline. Each verdict is labeled Live AI · Gemini, Cloud · practice mode, or Debated on this phone.
