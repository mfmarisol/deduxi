#!/usr/bin/env bash
set -e

echo "=== Enabling corepack + pnpm ==="
corepack enable
corepack prepare pnpm@9.15.0 --activate

echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile

echo "=== Installing Playwright Chromium ==="
npx playwright install --with-deps chromium

echo "=== Building API and dependencies ==="
pnpm run build --filter=@deduxi/api...

echo "=== Build complete ==="
