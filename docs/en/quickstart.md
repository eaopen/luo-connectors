# Quickstart (5 Minutes)

This page helps you quickly validate the Luo Rhythm API, Obsidian plugin, and OpenClaw skills.

## 1) API Smoke Test

```bash
curl https://api-luo.openea.site/v1/day/2026-03-20
curl https://api-luo.openea.site/v1/month/2026-03
curl "https://api-luo.openea.site/v1/day/2026-03-20?include=solar-term-times"
```

Expected:
- `day` returns a single-day `GCA-v1` payload
- `month` returns `iso_month` and `days[]`
- `include=solar-term-times` adds `metadata.solar_terms`

## 2) Obsidian Plugin Integration

Project: `../luo-obsidian-plugin`

### Build
```bash
cd ../luo-obsidian-plugin
npm i
npm run build
```

### Install
Copy files in `dist/` to:
`Vault/.obsidian/plugins/openea-luo-rhythm/`

### Core Setting
- `Day JSON URL Template`:
  `https://api-luo.openea.site/v1/day/{date}`

### Verify Commands
- Insert today block
- Create/overwrite today note
- Export today ICS into vault

## 3) OpenClaw Skill Quick Prompt

Skill files:
- `../../skills/luo-zh-calendar/SKILL.md`
- `../../skills/luo-intl-calendar/SKILL.md`

Minimal prompt (zh):

```text
按 luo-zh-calendar 输出 2026-03-20 的一行摘要 + 完整 GCA-v1 JSON。
数据源使用 https://api-luo.openea.site/v1/day/2026-03-20
```

Minimal prompt (intl):

```text
Use luo-intl-calendar and return a one-line summary plus full GCA-v1 JSON for 2026-03-20.
Data source: https://api-luo.openea.site/v1/day/2026-03-20
```

## 4) Promotion Copy (Ready to Paste)

```text
Luo Rhythm is live:
- API: https://api-luo.openea.site
- Obsidian: daily note YAML + GCA-v1 + ICS
- OpenClaw skills: zh + intl
```
