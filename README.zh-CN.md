# luo-connectors

English version: [README.md](README.md)。

`luo-connectors` 是洛律（Luo Rhythm）的对外 connect 总入口，承接公开集成文档、入口说明与外部接入关系。

Slogan：**流转中的秩序。**

## 当前状态

当前总入口会指向最小可运行的 Obsidian 插件和 Cloudflare Workers edge API；有些项目在本仓库内维护，有些则独立维护：

- Obsidian 插件：[luo-obsidian-plugin](../luo-obsidian-plugin)
- Cloudflare Workers API：[cal-workers](cal-workers)
- CLI（最小可运行版）：[cli](cli)

## Skills

- 国内版（zh）：[skills/luo-zh-calendar](skills/luo-zh-calendar)
- 国际版（intl）：[skills/luo-intl-calendar](skills/luo-intl-calendar)

## 模块说明

### luo-obsidian-plugin

开源 Obsidian 插件，用于将洛律历法数据集成到 Daily Notes。它是独立公开项目，但概念上属于 connectors family。

**功能特性**：
- 插入今日历法数据块
- 创建每日笔记
- 导出 ICS 事件
- 支持自定义日历名称

**文档**：[luo-obsidian-plugin/README.md](../luo-obsidian-plugin/README.md)

### cal-workers

`api-luo.openea.site` 的 Cloudflare Workers 实现，是一个可独立部署的 edge API，直接从 R2 静态文件提供历法数据。

**功能特性**：
- 边缘缓存，全球 CDN 加速
- GZIP 压缩支持
- CORS 跨域支持
- KV 缓存热点数据

**文档**：[cal-workers/README.md](cal-workers/README.md)
**部署指南**：[cal-workers/DEPLOY.md](cal-workers/DEPLOY.md)

### cli

用于终端查询历法信息的最小可运行 CLI，默认对接 `api-luo.openea.site`。

**支持命令**：
- `luo today`
- `luo day YYYY-MM-DD`
- `luo date YYYY-MM-DD`（`day` 别名）
- `luo month YYYY-MM`
- `luo year YYYY`
- 可选参数：`--solar-term-times`
- 可选参数：`--base-url <url>`

**本地运行**：

```bash
node cli/src/index.js today
node cli/src/index.js day 2026-03-20 --solar-term-times
```

## 架构设计

```
┌─────────────────────────────────────────────┐
│        数据流                         │
├─────────────────────────────────────────────┤
│  luo-factory/                          │
│  └─> 生成 JSON 年包 → R2 静态存储        │
├─────────────────────────────────────────────┤
│  luo-connectors/                         │
│  └─> 对外 connect 总入口 / 文档         │
├─────────────────────────────────────────────┤
│  cal-workers/                            │
│  └─> Workers → api-luo.openea.site     │
├─────────────────────────────────────────────┤
│  luo-obsidian-plugin/                   │
│  └─> GET /v1/day/{date}             │
└─────────────────────────────────────────────┘
```

## 迭代节奏

- 目标：1 天内上线 v1，然后以天 / 小时为单位快速迭代
- v1 包含 Cloudflare Workers API

## 环境要求

- Node.js 18+

## 文档

- 项目概览：[docs/zh-CN/overview.md](docs/zh-CN/overview.md)
- 快速开始：[docs/zh-CN/quickstart.md](docs/zh-CN/quickstart.md)
- 推广准备包：[docs/zh-CN/launch-kit.md](docs/zh-CN/launch-kit.md)
- GCA-v1 schema：[docs/gca-v1.schema.json](docs/gca-v1.schema.json)

## 许可证

MIT，详见 [LICENSE](LICENSE)。
