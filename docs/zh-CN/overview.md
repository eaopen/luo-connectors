# luo-connectors 项目概览

`luo-connectors` 是洛律（Luo Rhythm）的对外 connect 总入口。

## 品牌

- 命名：洛律（Luo Rhythm），简称“洛（Luo）”
- Slogan：流转中的秩序。

## 职责边界

- 面向集成方与用户的公开文档、入口说明
- 指向独立或仓内维护的公开连接项目

## 当前状态

作为对外入口存在；部分项目在本仓库维护，部分项目独立维护。

- `cli/` 已补齐最小可运行版本，可直接执行 day/month/year/today 查询。

## 迭代计划

- 目标：1 天内上线 v1，然后以天 / 小时为单位快速迭代
- v1 必包含 OpenClaw skill

## 开发/运行

环境要求：

- Node.js 18+

本包主要承担文档与入口说明职责。

CLI 快速运行：

```bash
node cli/src/index.js today
node cli/src/index.js day 2026-03-20 --solar-term-times
```

## 快速上手

- 快速开始：`docs/zh-CN/quickstart.md`
- 推广准备包：`docs/zh-CN/launch-kit.md`

## 许可证

MIT，见 `LICENSE`。
