#!/usr/bin/env bash
set -euo pipefail

base_url="${APP_BASE_URL:-http://localhost:8080}"
admin_email="${APP_BOOTSTRAP_ADMIN_EMAIL:?APP_BOOTSTRAP_ADMIN_EMAIL is required}"
admin_password="${APP_BOOTSTRAP_ADMIN_PASSWORD:?APP_BOOTSTRAP_ADMIN_PASSWORD is required}"

echo "[1/3] Front-end health check"
curl --fail --silent --show-error "${base_url}/health"
echo

echo "[2/3] Authentication check"
login_payload="$(jq --null-input \
  --arg email "${admin_email}" \
  --arg password "${admin_password}" \
  '{email: $email, password: $password}')"

login_response="$(curl --fail --silent --show-error \
  --request POST \
  --header 'Content-Type: application/json' \
  --data "${login_payload}" \
  "${base_url}/auth/login")"

token="$(printf '%s' "${login_response}" | jq --exit-status --raw-output '.token')"

echo "[3/3] Authenticated API check"
curl --fail --silent --show-error \
  --header "Authorization: Bearer ${token}" \
  "${base_url}/api/missions" >/dev/null

echo "Smoke test passed for ${base_url}."
