#!/usr/bin/env bash
# Local dev with Railway production env vars.
# railway run alone injects DATABASE_URL with postgres.railway.internal,
# which only resolves inside Railway — not on your Mac. This script keeps
# all other service variables but swaps in the Postgres public TCP URL.
set -euo pipefail
cd "$(dirname "$0")"

PUBLIC_DB="$(railway run --service Postgres printenv DATABASE_PUBLIC_URL)"

exec railway run env \
  DATABASE_URL="$PUBLIC_DB" \
  PORT=3001 \
  CLIENT_URL=http://localhost:5173 \
  npm run dev
