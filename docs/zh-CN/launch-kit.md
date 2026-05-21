# Luo 推广准备包（免费方案）

面向 API 已发布后的快速推广，先确保可用性，再做渠道扩散。

## 1. 对外入口（统一域名）

- 主站: https://luo.openea.site
- 中文入口: https://zh-luo.openea.site
- 国际入口: https://intl-luo.openea.site
- Quickstart: https://luo.openea.site/quickstart
- API: https://api-luo.openea.site

## 2. 3 分钟演示脚本（现场可复制）

```bash
curl https://api-luo.openea.site/v1/day/2026-03-20
curl https://api-luo.openea.site/v1/month/2026-03
curl "https://api-luo.openea.site/v1/day/2026-03-20?include=solar-term-times"
```

演示要点：
- 返回含 `version/anchor/chinese_lunar/meta`，可直接接插件与 Agent。
- 站点 `/zh/` 与 `/intl/` 使用同一 API，可作为功能演示页。

## 3. Obsidian 插件发布前检查清单

- 默认地址为 `https://api-luo.openea.site/v1/day/{date}`
- `npm run build` 成功
- 三个命令可用：
  - 插入今日洛律块
  - 创建/覆盖今日洛律日记
  - 导出今日 ICS 到 Vault

仓库：
- https://github.com/Open-World-FAI/luo-rhythm-obsidian

## 4. OpenClaw Skill 发布前检查清单

- `luo-zh-calendar` 与 `luo-intl-calendar` 的 API 示例均使用 `api-luo`
- 默认输出遵循 “1 行摘要 + 完整 GCA-v1 JSON”
- 需要 ICS 时输出 `TRANSP:TRANSPARENT`

目录：
- `skills/luo-zh-calendar/SKILL.md`
- `skills/luo-intl-calendar/SKILL.md`

## 5. 免费推广动作（优先级从高到低）

### 第一波：Quickstart（技术用户）
- 在 README、产品主页、社媒简介都挂 `https://luo.openea.site/quickstart`
- 成功标准：用户能复制 curl 并拿到 `version/anchor/chinese_lunar/meta`
- 渠道：GitHub README、V2EX、技术短帖

### 第二波：Obsidian 场景（内容创作者）
- 用 1 张动图展示“命令 -> 今日块 -> ICS 导出”
- 成功标准：用户能在 Daily Notes 中生成洛律块
- 渠道：Obsidian 社区、生产力工具群、个人博客

### 第三波：Skill 场景（AI 工具用户）
- 用 1 段标准提示词展示“直接出 JSON + 日摘要”
- 成功标准：agent 能稳定按 GCA-v1 输出，不把 P2/P3 字段伪造成已完成

## 6. 社媒文案模板

### 中文短帖

> Luo 历法 API 已上线，支持中文历法语义 + 结构化 GCA-v1 输出。
> 
> 5 分钟接入：
> https://luo.openea.site/quickstart
> 
> API：
> https://api-luo.openea.site

### 英文短帖

> Luo calendar API is live with structured GCA-v1 output for cultural calendar context.
>
> Quickstart in 5 minutes:
> https://luo.openea.site/quickstart
>
> API endpoint:
> https://api-luo.openea.site

## 7. 推广前门槛（必须满足）

- `https://luo.openea.site/quickstart` 返回 200
- `https://zh-luo.openea.site/` 返回 200
- `https://intl-luo.openea.site/` 返回 200
- `https://api-luo.openea.site/v1/day/2026-03-20` 返回 200

满足以上四项后再集中推广，避免冷启动流量浪费。Badge endpoint 属于可选卖点，只有当 `/v1/badge/today` 或 `/v1/badge/day/{YYYY-MM-DD}` 返回 `image/svg+xml` 后才进入公开文案。
