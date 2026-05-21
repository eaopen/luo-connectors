# Luo Launch Kit (Free Plan)

Use this after API publishing: validate first, then promote.

## 1. Public entry points

- Main site: https://luo.openea.site
- Chinese experience: https://zh-luo.openea.site
- International experience: https://intl-luo.openea.site
- Quickstart: https://luo.openea.site/quickstart
- API: https://api-luo.openea.site

## 2. 3-minute live demo script

```bash
curl https://api-luo.openea.site/v1/day/2026-03-20
curl https://api-luo.openea.site/v1/month/2026-03
curl "https://api-luo.openea.site/v1/day/2026-03-20?include=solar-term-times"
```

Demo talking points:
- Response includes `version/anchor/chinese_lunar/meta`, ready for plugins and agents.
- `/zh/` and `/intl/` are live examples backed by the same API.

## 3. Obsidian plugin pre-launch checklist

- Default URL template is `https://api-luo.openea.site/v1/day/{date}`
- `npm run build` passes
- Three commands work:
  - Insert today Luo block
  - Create/overwrite today note
  - Export today ICS to Vault

Repository:
- https://github.com/Open-World-FAI/luo-rhythm-obsidian

## 4. OpenClaw skill pre-launch checklist

- Both `luo-zh-calendar` and `luo-intl-calendar` examples point to `api-luo`
- Default output follows “one-line summary + full GCA-v1 JSON”
- ICS output uses `TRANSP:TRANSPARENT`

Paths:
- `skills/luo-zh-calendar/SKILL.md`
- `skills/luo-intl-calendar/SKILL.md`

## 5. Free promotion sequence

1. Publish Quickstart first (developer audience)
- Put `https://luo.openea.site/quickstart` in README, homepage, and social bio.

2. Publish Obsidian scenario next (creator audience)
- Show one short GIF: command -> today block -> ICS export.

3. Publish Skill scenario last (AI workflow audience)
- Share one standard prompt that outputs summary + JSON.

## 6. Social post templates

### Short EN post

> Luo calendar API is live with structured GCA-v1 output for cultural calendar context.
>
> Quickstart in 5 minutes:
> https://luo.openea.site/quickstart
>
> API endpoint:
> https://api-luo.openea.site

### Short ZH post

> Luo 历法 API 已上线，支持中文历法语义 + 结构化 GCA-v1 输出。
>
> 5 分钟接入：
> https://luo.openea.site/quickstart
>
> API：
> https://api-luo.openea.site

## 7. Hard gate before promotion

- `https://luo.openea.site/quickstart` returns 200
- `https://zh-luo.openea.site/` returns 200
- `https://intl-luo.openea.site/` returns 200
- `https://api-luo.openea.site/v1/day/2026-03-20` returns 200

Run promotion only after all four checks pass.
