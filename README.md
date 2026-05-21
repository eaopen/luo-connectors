# luo-connectors

English README. 中文版见 [README.zh-CN.md](README.zh-CN.md)。

`luo-connectors` is the public connect hub of Luo Rhythm (integration docs, entrypoints and external-facing connection guidance).

Slogan: "Order within the Flow."

## Status

The hub currently points to a minimal Obsidian plugin and a Cloudflare Workers edge API. Some projects live here, while others are maintained independently:

- Obsidian plugin: [luo-obsidian-plugin](../luo-obsidian-plugin)
- Cloudflare Workers API: [cal-workers](cal-workers)
- CLI (minimal runnable): [cli](cli)

## Skills

- Chinese (zh): [skills/luo-zh-calendar](skills/luo-zh-calendar)
- International (intl): [skills/luo-intl-calendar](skills/luo-intl-calendar)

## Modules

### luo-obsidian-plugin

Open source Obsidian plugin for daily note integration with Luo Rhythm calendar data. It is maintained as a standalone public project, while remaining conceptually part of the connectors family.

**Features**:
- Insert today's calendar block
- Create daily notes
- Export ICS events
- Custom calendar name support

**Documentation**: [luo-obsidian-plugin/README.md](../luo-obsidian-plugin/README.md)

### cal-workers

Cloudflare Workers implementation of `api-luo.openea.site` - a deployable edge API serving static calendar data from R2.

**Features**:
- Edge caching with global CDN
- GZIP compression support
- CORS enabled
- KV cache for hot data

**Documentation**: [cal-workers/README.md](cal-workers/README.md)
**Deployment**: [cal-workers/DEPLOY.md](cal-workers/DEPLOY.md)

### cli

Minimal CLI for terminal calendar queries against `api-luo.openea.site`.

**Supported commands**:
- `luo today`
- `luo day YYYY-MM-DD`
- `luo date YYYY-MM-DD` (alias of `day`)
- `luo month YYYY-MM`
- `luo year YYYY`
- optional flag: `--solar-term-times`
- optional flag: `--base-url <url>`

**Local run**:

```bash
node cli/src/index.js today
node cli/src/index.js day 2026-03-20 --solar-term-times
```

## Architecture

```
┌─────────────────────────────────────────────┐
│        Data Flow                         │
├─────────────────────────────────────────────┤
│  luo-factory/                          │
│  └─> Generate JSON year packs → R2     │
├─────────────────────────────────────────────┤
│  luo-connectors/                         │
│  └─> Public connect hub / docs          │
├─────────────────────────────────────────────┤
│  cal-workers/                            │
│  └─> Workers → api-luo.openea.site    │
├─────────────────────────────────────────────┤
│  luo-obsidian-plugin/                   │
│  └─> GET /v1/day/{date}             │
└─────────────────────────────────────────────┘
```

## Release cadence

- Target: ship v1 within 24 hours, then iterate daily / hourly
- v1 includes Cloudflare Workers API

## Requirements

- Node.js 18+

## Docs

- Overview: [docs/en/overview.md](docs/en/overview.md)
- Quickstart: [docs/en/quickstart.md](docs/en/quickstart.md)
- Launch Kit: [docs/en/launch-kit.md](docs/en/launch-kit.md)
- GCA-v1 schema: [docs/gca-v1.schema.json](docs/gca-v1.schema.json)

## License

MIT. See [LICENSE](LICENSE).
