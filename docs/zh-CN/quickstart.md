# 快速开始（5 分钟）

本页用于快速验证 `Luo Rhythm` API、Obsidian 插件与 OpenClaw skill 是否可用。

## 1) API 快速验证

```bash
curl https://api-luo.openea.site/v1/day/2026-03-20
curl https://api-luo.openea.site/v1/month/2026-03
curl "https://api-luo.openea.site/v1/day/2026-03-20?include=solar-term-times"
```

预期：
- `day` 返回单日 `GCA-v1` JSON
- `month` 返回 `iso_month` 与 `days[]`
- 带 `include=solar-term-times` 时返回 `metadata.solar_terms`

## 2) Obsidian 插件接入

项目：`../luo-obsidian-plugin`

### 构建
```bash
cd ../luo-obsidian-plugin
npm i
npm run build
```

### 安装
将 `dist/` 下文件复制到：
`Vault/.obsidian/plugins/openea-luo-rhythm/`

### 核心配置
- `Day JSON URL Template`:
  `https://api-luo.openea.site/v1/day/{date}`
- 可选打开 `Insert YAML Block` / `Insert JSON Block`

### 验证命令
- 插入今日洛律块
- 创建/覆盖今日洛律日记
- 导出今日 ICS 到 Vault

## 3) OpenClaw Skill 快速调用

技能文件：
- `../../skills/luo-zh-calendar/SKILL.md`
- `../../skills/luo-intl-calendar/SKILL.md`

推荐最小提示词（中文）：

```text
按 luo-zh-calendar 输出 2026-03-20 的一行摘要 + 完整 GCA-v1 JSON。
数据源使用 https://api-luo.openea.site/v1/day/2026-03-20
```

推荐最小提示词（国际）：

```text
Use luo-intl-calendar and return a one-line summary plus full GCA-v1 JSON for 2026-03-20.
Data source: https://api-luo.openea.site/v1/day/2026-03-20
```

## 4) 推荐对外推广文案（可直接复制）

```text
Luo Rhythm 已上线：
- API: https://api-luo.openea.site
- Obsidian: daily note YAML + GCA-v1 + ICS
- OpenClaw skills: zh/intl 双模式
```
