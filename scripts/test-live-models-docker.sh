#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="${FLOWHELM_IMAGE:-${FLOWHELM_BOT_IMAGE:-flowhelm:local}}"
CONFIG_DIR="${FLOWHELM_CONFIG_DIR:-${FLOWHELM_BOT_CONFIG_DIR:-$HOME/.flowhelm}}"
WORKSPACE_DIR="${FLOWHELM_WORKSPACE_DIR:-${FLOWHELM_BOT_WORKSPACE_DIR:-$HOME/.flowhelm/workspace}}"
PROFILE_FILE="${FLOWHELM_PROFILE_FILE:-${FLOWHELM_BOT_PROFILE_FILE:-$HOME/.profile}}"

PROFILE_MOUNT=()
if [[ -f "$PROFILE_FILE" ]]; then
  PROFILE_MOUNT=(-v "$PROFILE_FILE":/home/node/.profile:ro)
fi

echo "==> Build image: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$ROOT_DIR/Dockerfile" "$ROOT_DIR"

echo "==> Run live model tests (profile keys)"
docker run --rm -t \
  --entrypoint bash \
  -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -e HOME=/home/node \
  -e NODE_OPTIONS=--disable-warning=ExperimentalWarning \
  -e FLOWHELM_LIVE_TEST=1 \
  -e FLOWHELM_LIVE_MODELS="${FLOWHELM_LIVE_MODELS:-${FLOWHELM_BOT_LIVE_MODELS:-all}}" \
  -e FLOWHELM_LIVE_PROVIDERS="${FLOWHELM_LIVE_PROVIDERS:-${FLOWHELM_BOT_LIVE_PROVIDERS:-}}" \
  -e FLOWHELM_LIVE_MODEL_TIMEOUT_MS="${FLOWHELM_LIVE_MODEL_TIMEOUT_MS:-${FLOWHELM_BOT_LIVE_MODEL_TIMEOUT_MS:-}}" \
  -e FLOWHELM_LIVE_REQUIRE_PROFILE_KEYS="${FLOWHELM_LIVE_REQUIRE_PROFILE_KEYS:-${FLOWHELM_BOT_LIVE_REQUIRE_PROFILE_KEYS:-}}" \
  -v "$CONFIG_DIR":/home/node/.flowhelm \
  -v "$WORKSPACE_DIR":/home/node/.flowhelm/workspace \
  "${PROFILE_MOUNT[@]}" \
  "$IMAGE_NAME" \
  -lc "set -euo pipefail; [ -f \"$HOME/.profile\" ] && source \"$HOME/.profile\" || true; cd /app && pnpm test:live"
