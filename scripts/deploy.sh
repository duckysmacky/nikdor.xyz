#!/usr/bin/env bash
set -euo pipefail

# Required env vars: REPO_PATH

cd "$REPO_PATH"
git fetch origin master
git reset --hard origin/master
cargo build --release --manifest-path backend/Cargo.toml
systemctl --user restart nikdor.xyz-backend.service
