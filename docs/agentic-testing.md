# Folio agentic testing

## Foundation: Playwright

Playwright is Folio's repeatable browser-test layer. Playwright launches its own Chromium. It starts Vite's development server locally. GitHub Actions builds Folio first and tests the production preview.

```sh
pnpm exec playwright install chromium
pnpm run test:e2e
```

Use `pnpm run test:e2e:ui` when developing a test locally. Keep durable coverage in `tests/`; use semantic roles and accessible names instead of CSS selectors.

## Chrome DevTools MCP

Use DevTools MCP when an agent needs to diagnose a real browser issue: console errors, failed requests, rendering/performance traces, or unexpected DOM state. It is complementary to Playwright, not a replacement for its regression tests.

Add it once Node.js is installed for your normal terminal environment:

```sh
codex mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest
```

For Claude Code, add this project-scoped server to its MCP configuration:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--autoConnect"]
    }
  }
}
```

Keep the tool attached only to a development browser profile. Do not use a logged-in personal profile for autonomous testing.

## Browser Use

Browser Use is for short, exploratory agent sessions after Playwright has covered a critical flow. The local-Chrome mode is free; cloud browsers are optional and should not be enabled for the basic Folio workflow.

With Python 3.12 and `uv` installed, run:

```sh
uv tool install --python 3.12 browser-use
browser-use skill install
browser-use --doctor
```

Give the agent a bounded prompt, for example: "In Folio's local preview, create a local profile, open the sample portfolio, add a text block, and report any broken or confusing step. Do not publish, delete, or use external accounts."

## Replay QA and Momentic

Do not add either to CI yet. Replay QA can be evaluated for free against a running reachable URL after the critical Playwright flows exist. It is the better first trial because it can explore Folio and return replayable evidence for React failures. Momentic is worth a later trial only if a non-technical QA author needs to maintain many natural-language or visual test cases.

Keep the order: Playwright for deterministic regressions, DevTools MCP for diagnosis, Browser Use for scoped exploration, then Replay QA only if it finds issues the first three miss.
