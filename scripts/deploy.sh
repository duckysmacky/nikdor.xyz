#!/usr/bin/env bash
set -euo pipefail

# Required env vars: DEPLOY_PATH

cd "$DEPLOY_PATH"
git fetch origin master
git reset --hard origin/master

cd backend
docker compose pull
docker compose up -d
