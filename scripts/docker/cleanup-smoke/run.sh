#!/usr/bin/env bash
set -euo pipefail

cd /repo

export FLOWHELM_STATE_DIR="/tmp/flowhelm-test"
export FLOWHELM_CONFIG_PATH="${FLOWHELM_STATE_DIR}/flowhelm.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${FLOWHELM_STATE_DIR}/credentials"
mkdir -p "${FLOWHELM_STATE_DIR}/agents/main/sessions"
echo '{}' >"${FLOWHELM_CONFIG_PATH}"
echo 'creds' >"${FLOWHELM_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${FLOWHELM_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm flowhelm reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${FLOWHELM_CONFIG_PATH}"
test ! -d "${FLOWHELM_STATE_DIR}/credentials"
test ! -d "${FLOWHELM_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${FLOWHELM_STATE_DIR}/credentials"
echo '{}' >"${FLOWHELM_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm flowhelm uninstall --state --yes --non-interactive

test ! -d "${FLOWHELM_STATE_DIR}"

echo "OK"
