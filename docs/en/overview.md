# luo-connectors Overview

`luo-connectors` is the public connect hub of Luo Rhythm.

## Brand

- Name: Luo Rhythm
- Slogan: "Order within the Flow."

## Scope

- Public-facing documentation and entrypoints for integrations
- Links to standalone or in-repo public connection projects

## Status

Acts as the outward-facing hub. Some projects are maintained here, while others are maintained as standalone public repositories.

- Current P1 baseline includes Cloudflare Workers API, CLI, skills, public docs, and the standalone Obsidian plugin.
- Minimal CLI is now runnable under `cli/` for day/month/year/today queries.
- Notion, Raycast/Alfred, Home Assistant, and calendar subscription integrations are roadmap items.

## Release plan

- Target: ship v1 within 24 hours, then iterate daily / hourly
- v1 includes Workers API, CLI, OpenClaw/agent skills, and Obsidian plugin entrypoints.

## Build / Dev

Requirements:

- Node.js 18+

This package primarily serves as a documentation and entry hub.

CLI quick run:

```bash
node cli/src/index.js today
node cli/src/index.js day 2026-03-20 --solar-term-times
```

## Quickstart

- Quickstart: `docs/en/quickstart.md`
- Launch Kit: `docs/en/launch-kit.md`

## License

MIT. See `LICENSE`.
