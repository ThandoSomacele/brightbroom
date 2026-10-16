#!/bin/sh
# scripts/docker/start.sh: container entrypoint for self-hosted deployments.
#
# 1. Applies the fresh-install migrations (./drizzle/fresh) unless
#    RUN_MIGRATIONS=false. Safe on every start: applied migrations are skipped.
# 2. Replaces this shell with the Node server, so it receives SIGTERM directly.
#
# Seeding the first admin is a separate, one-off step (docs/SELF_HOSTING.md).
set -e

if [ "${RUN_MIGRATIONS:-true}" != "false" ]; then
  echo "[start] applying database migrations"
  node scripts/docker/migrate.mjs
else
  echo "[start] RUN_MIGRATIONS=false, skipping migrations"
fi

exec node build
