# luo-connectors

> 洛律 (Luo Rhythm): Order within the Flow, Origin of All Numbers in a Square Inch.

We do not create time. We merely transform five thousand years of stellar movements, imperial changes, and seasonal phenomena into logical metadata understandable by modern productivity tools.

## Project Overview

`luo-connectors` is the public connect hub of Luo Rhythm. It contains the Workers API, minimal CLI, public docs, launch material, and skill definitions. Standalone public projects such as the Obsidian plugin remain conceptually part of this family.

### Core Features

- **Cloudflare Workers API**: Serves GCA-v1 day/month/year/badge responses from R2 year packs
- **CLI Tool**: Queries day/month/year/today data from `api-luo.openea.site`
- **Skills**: Provides zh/intl calendar skills for agent workflows
- **Public docs**: Quickstart, launch kit, and GCA-v1 schema
- **Planned connectors**: Notion, Raycast/Alfred, and Home Assistant are roadmap items, not current P1 deliverables

### Tech Stack

- **Languages**: TypeScript, JavaScript
- **Frameworks**: Cloudflare Workers, Node.js CLI
- **API Integration**: `api-luo.openea.site`

## Quick Start

### Obsidian Plugin

```bash
# The Obsidian plugin is maintained as ../luo-obsidian-plugin in this workspace.
# Build it there, then install the dist files manually while packaging is pending.
```

### CLI Tool

```bash
# Install CLI
npm install -g @luo/openea-cli

# Query today's calendar data
luo today

# Query specific date
luo date 2026-03-19
```

### API Usage

```bash
# Get specific date
curl https://api-luo.openea.site/v1/day/2026-03-19

# Get specific month
curl https://api-luo.openea.site/v1/month/2026-03

# Get specific year
curl https://api-luo.openea.site/v1/year/2026
```

GCA-v1 schema: [docs/gca-v1.schema.json](docs/gca-v1.schema.json)

## Contributing Guidelines

We welcome community contributions! Please follow these steps:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under MIT License - see [LICENSE](LICENSE) file for details.

## Contact

- **GitHub**: https://github.com/openea/luo-connectors
- **Documentation**: https://docs.luo.openea.site
- **Email**: support@luo.openea.site

---

> Luo Rhythm does not pursue flashy power demonstrations, returning to obsession with algorithmic precision and cultural depth.
