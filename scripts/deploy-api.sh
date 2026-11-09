#!/bin/bash
# Deploys work/repo/api to the Vercel project kaiser-noir-twin-mind (production). Needs the vercel connector.
set -e
cd "$(dirname "$0")/../api"
T=team_hFSCZyhNmB4S48ZbJJnVl3uY
python3 - > /tmp/dep.json <<'PY'
import json,base64
files=["api/decide.js","src/debate.js","src/minds.js","src/verdict.js","package.json","vercel.json"]
print(json.dumps({"name":"kaiser-noir-twin-mind","project":"kaiser-noir-twin-mind","target":"production","projectSettings":{"framework":None},
 "files":[{"file":f,"data":base64.b64encode(open(f,'rb').read()).decode(),"encoding":"base64"} for f in files]}))
PY
ID=$(curl -s -X POST "https://api.vercel.com/v13/deployments?teamId=$T&skipAutoDetectionConfirmation=1" -H "content-type: application/json" --data @/tmp/dep.json | jq -r .id)
for i in $(seq 1 30); do s=$(curl -s "https://api.vercel.com/v13/deployments/$ID?teamId=$T" | jq -r .readyState); [ "$s" = READY ] || [ "$s" = ERROR ] && break; sleep 4; done
echo "$ID $s"
