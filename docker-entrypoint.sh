#!/bin/bash
set -e

# Ensure config is set for non-loopback access
# This works even if a volume is mounted because it runs at container start
flowhelm config set gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback true || true

# Execute the main command
exec "$@"
