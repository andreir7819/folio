#!/bin/zsh

# Use the Node runtime bundled with Codex, so no system Node/pnpm setup is needed.
set -e

runtime_node="/Users/andreiringor01/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin"
runtime_pnpm="/Users/andreiringor01/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm"

export PATH="$runtime_node:$PATH"
cd "${0:A:h}"
exec "$runtime_pnpm" dev --host 127.0.0.1 --port 5174
