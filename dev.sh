#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-4173}"
URL="http://localhost:${PORT}/"

echo "Starting local server at ${URL}"
python3 -m http.server "${PORT}" &
SERVER_PID=$!

cleanup() {
  if kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

sleep 0.5

if command -v open >/dev/null 2>&1; then
  open "${URL}"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "${URL}"
fi

wait "${SERVER_PID}"
