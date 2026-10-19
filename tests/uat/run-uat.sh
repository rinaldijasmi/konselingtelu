#!/usr/bin/env bash
# Menjalankan UAT otomatis. Service-role key diambil lewat Supabase CLI dan hanya ada di memori proses ini.
# Pemakaian: tests/uat/run-uat.sh [opsi playwright]
#   UAT_BASE_URL=http://localhost:8000/ tests/uat/run-uat.sh   # uji lokal
set -euo pipefail
cd "$(dirname "$0")"

PROJECT_REF="${SUPABASE_PROJECT_REF:-rakqjbzbuctkzbgjueyu}"
if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  SUPABASE_SERVICE_ROLE_KEY="$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json 2>/dev/null \
    | python3 -c "import json,sys;print([k['api_key'] for k in json.load(sys.stdin) if k['name']=='service_role'][0])")"
  export SUPABASE_SERVICE_ROLE_KEY
fi

[ -d node_modules ] || npm install --silent
npx playwright test "$@"
