# luo-connectors

> 洛律 (Luo Rhythm): Order within the Flow, Origin of All Numbers in a Square Inch.

We do not create time. We merely transform five thousand years of stellar movements, imperial changes, and seasonal phenomena into logical metadata understandable by modern productivity tools.

## Project Overview

`luo-connectors` is the public repository of the Luo Rhythm project, containing all open-source plugins, connectors, and API documentation. This is the "face" of the brand—the part users first encounter and use.

### Core Features

- **Obsidian Plugin**: Automatically fills Daily Notes with calendar metadata
- **Notion Integration**: Provides API support for Notion database population
- **Raycast/Alfred Extension**: Quick query for historical dates and era names
- **Home Assistant Integration**: Uses solar terms and traditional colors as "environment parameters"
- **CLI Tool**: Terminal users quickly query calendar information

### Tech Stack

- **Languages**: TypeScript, JavaScript, Python
- **Frameworks**: Obsidian Plugin API, Alfred Workflow, HASS Integration
- **API Integration**: `api.luo.openea.site`

## Quick Start

### Obsidian Plugin

```bash
# Install plugin
npm install @luo/openea-obsidian

# Or manual installation
# Download release version, copy to Obsidian plugins directory
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
# Get today's calendar data
curl https://api.luo.openea.site/v1/day

# Get specific date
curl https://api.luo.openea.site/v1/day?date=2026-03-19
```

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
