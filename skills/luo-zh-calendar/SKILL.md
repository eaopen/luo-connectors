---
name: "luo-zh-calendar"
description: "Provides China-focused calendar & cultural context (lunar, solar terms, wu-hou, suit/avoid, aesthetic hints) via Luo GCA-v1 + RFC5545 feeds. Invoke when user asks about Chinese calendar context or needs Daily Note/ICS content."
---

# 洛律 · 中文版日历 Skill（luo-zh-calendar）

面向“国内版/新中文化版”的轻量元数据能力：输出农历/节气/物候/宜忌/传统色/AI 提示，并支持导出 RFC 5545 的 ICS 事件文本，用于寄生到系统日历、Obsidian、CLI 等生态。

## 何时调用

- 用户问“今天是什么日子/农历/节气/宜忌/传统色/物候”等
- 需要生成 Daily Note 的 YAML/正文片段
- 需要生成或校验 ICS 订阅内容（不占用用户忙闲：TRANSPARENT）
- 需要以“全量协议字段不变”的方式输出（P1 先填核心字段，其它字段保持空/空数组）

## 设计原则（面向用户与 AI）

- 一套能力内核 + 多个使用场景适配：不为不同宿主重复定义字段与行为
- 同时输出“人读版 + 机读版”：人读版用于阅读与分享，机读版用于插件/Agent 严格消费
- 轻量化：只输出逻辑密集型元数据；渲染/图片/大模型消耗由用户自己的工具与账号完成

## 数据来源与接口约定

以 GCA-v1 为唯一协议（一次性定义，分阶段填充），并提供两种出口：

1) 标准版 JSON（推荐用于插件/Agent）
- `GET https://api-luo.openea.site/v1/day/{YYYY-MM-DD}`

2) 兼容版 ICS（推荐用于系统日历订阅）
- `GET https://static.luo.openea.site/v1/day/{YYYY-MM-DD}.ics`

如果后端尚未上线，可用本地 `luo-factory/cal-core` 中合并后的 Java 引擎模拟 JSON/ICS，但输出字段必须与 GCA-v1 对齐。

## 输出策略（默认行为）

- 默认返回：一段极短的人读摘要 + 一个完整的 GCA-v1 JSON（未实现字段保留 key 并返回空/null）
- 当用户明确需要“订阅/导入系统日历/ICS”时：再追加 RFC 5545 ICS 文本（默认 `TRANSP:TRANSPARENT`）

## 输出规范（中文版重点）

### 必填（P1 就具备）
- `version`
- `anchor.iso_8601`, `anchor.weekday`
- `chinese_lunar`：`cycle`/`animal`/`month`/`day`/`solar_term`/`phenology`
- `meta.aesthetic`：`traditional_color`/`visual_keywords`/`font_suggestion`
- `meta.lifestyle`：`suit`/`avoid`

### 可空（但 Key 必须保留）
- `history`（P2 填充）
- `religious`（P3 填充）
- `synthetic`（P4 填充）

## Profiles（不同宿主的适配）

### OpenClaw

- 优先输出结构化 JSON（GCA-v1）便于工具链消费
- 需要 ICS 时单独输出 `text/ics`，并保持 RFC 5545 折行/转义

### 通用聊天（ChatGPT/Claude 等）

- 先给 1 行摘要，再给 JSON/ICS（按用户要求）
- 避免“长篇民俗解释”，只输出可用于工作流的元信息

### AI 编程工具（Trae/Cursor 等）

- 输出可直接粘贴到工程里的片段（YAML/ICS/JSON），并说明字段含义与稳定性
- 保持字段名与协议一致，避免生成“看似更好但不兼容”的自定义结构

## 行为约束

- 只提供“逻辑密集型元数据”，不提供任何资源消耗型服务（不生成图片/不跑渲染）
- 视觉相关仅输出 `visual_keywords`、色值、字体建议；图片/海报由用户用自己的账号与工具生成
- 不杜撰历史/宗教数据；未实现字段必须返回空或 null，并在文本中明确“当前阶段未启用”
- 需要 ICS 时，必须遵循 RFC 5545：转义、换行折叠、UTC 的 DTSTAMP、DATE 值的 DTSTART/DTEND

## 示例输出（面向 Obsidian 的最小片段）

### YAML 元数据（建议）
```yaml
luo:
  date: 2026-03-19
  lunar: 丙午年二月初一
  solar_term: 春分前夕
  wu_hou: 鹰化为鸠
  color: 天青 #87B8DE
  suit: [塞穴, 整手足甲]
  avoid: [嫁娶, 作灶]
```

### ICS 事件（最小字段）
```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OpenEA//Luo Rhythm 1.0//CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:OpenEA 历法文化图层
X-WR-TIMEZONE:Asia/Shanghai
BEGIN:VEVENT
UID:20260319-openea-cal-demo
DTSTAMP:20260319T000000Z
DTSTART;VALUE=DATE:20260319
DTEND;VALUE=DATE:20260320
SUMMARY:春分 (Spring Equinox) · 丙午年二月初一
DESCRIPTION:【历法】农历丙午年二月初一\n【物候】鹰化为鸠\n【美学】天青 (#87B8DE)
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR
```
