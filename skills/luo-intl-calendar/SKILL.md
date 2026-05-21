---
name: "luo-intl-calendar"
description: "Provides global calendar context (multi-calendar, major religious calendars, cross-cultural notes) via Luo GCA-v1 + RFC5545 feeds. Invoke when user needs international/religious date context or wants an ICS overlay calendar."
---

# 洛律 · 国际版日历 Skill（luo-intl-calendar）

面向“国际版/全球视野”的轻量元数据能力：以 ISO-8601/JDN 为锚，输出多历法与主要宗教历法信息，并可输出 RFC 5545 的 ICS 事件文本，作为系统日历的“文化图层”。

## 何时调用

- 用户问“某天在伊斯兰历/希伯来历/印度历/东正教（儒略历）是什么日期”
- 需要跨时区/跨文化协作时的日期上下文（仅给出元数据与提醒，不做行程管理）
- 需要生成可订阅的 ICS（Google/Apple/Outlook 兼容）

## 语言策略（面向用户与 AI）

- 默认跟随用户输入语言输出说明文本：中文问答→中文；英文问答→英文
- 当用户明确要求“双语”或用于跨国协作：输出 ZH/EN 两段（尽量短）
- 结构化输出（JSON/ICS）保持稳定字段，不因为语言变化而改变 key

## 设计原则（面向用户与 AI）

- 一套能力内核 + 多个使用场景适配：不为不同宿主重复定义字段与行为
- 同时输出“人读版 + 机读版”：人读版用于阅读与分享，机读版用于插件/Agent 严格消费
- 轻量化：只输出逻辑密集型元数据；渲染/图片/大模型消耗由用户自己的工具与账号完成

## 数据来源与接口约定

标准协议仍然是 GCA-v1（结构固定），阶段性填充：

1) 标准版 JSON（推荐用于 Agent/插件）
- `GET https://api-luo.openea.site/v1/day/{YYYY-MM-DD}`

2) 兼容版 ICS（推荐用于订阅）
- `GET https://static.luo.openea.site/v1/intl/day/{YYYY-MM-DD}.ics`

若 `intl` 的静态订阅尚未上线，可先用同一路由的动态 ICS 或使用单日事件渲染器输出。

## 输出策略（默认行为）

- 默认返回：一段极短的人读摘要 + 一个完整的 GCA-v1 JSON（未实现字段保留 key 并返回空/null）
- 当用户明确需要“订阅/导入系统日历/ICS”时：再追加 RFC 5545 ICS 文本（默认 `TRANSP:TRANSPARENT`）

## 输出规范（国际版重点）

### 必填（与中文版一致）
- `version`
- `anchor.iso_8601`, `anchor.weekday`

### 逐步填充（国际版核心）
- `religious`（P3 主体）
  - `islamic`：支持声明算法/口径（如 Umm al-Qura / tabular），未实现时仅返回 `date/event=null`
  - `hebrew`：注意“节日前夕”的语义（若无法准确判断，保持空）
  - `indian`：先以 `standard_saka` 为最小字段
  - `orthodox`：以 `julian_date` 为最小字段

### 可选（不影响兼容）
- `meta.ai_hints`：用于生成跨文化沟通的语气提示（仅文本）
- `history`：东亚年号/纪元（若国际版需要也可复用，但不强制）

## Profiles（不同宿主的适配）

### OpenClaw

- 优先输出结构化 JSON（GCA-v1）便于工具链消费
- 需要 ICS 时单独输出 `text/ics`，并保持 RFC 5545 折行/转义

### 通用聊天（ChatGPT/Claude 等）

- 先给 1 行摘要，再给 JSON/ICS（按用户要求）
- 若用户未指定语言：优先与用户界面语言一致；需要跨国场景再提供双语

### AI 编程工具（Trae/Cursor 等）

- 输出可直接粘贴的 JSON/ICS，并说明字段稳定性与“未启用字段”的处理规则
- 避免生成不可验证的宗教节日/冲突结论，数据不确定时保持空字段

## 行为约束

- 不输出需要持续资源消耗的能力（不生成图片/不调用第三方付费接口）
- 不杜撰宗教节日与冲突判断：未实现则返回空，并在解释中明确“当前阶段未启用”
- ICS 必须是“文化图层”，默认 `TRANSP:TRANSPARENT`，避免影响用户忙闲

## 示例输出（兼容版 ICS 的最小字段）

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//OpenEA//Luo Rhythm 1.0//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:OpenEA Calendar Culture Layer (Intl)
BEGIN:VEVENT
UID:20260319-openea-intl-demo
DTSTAMP:20260319T000000Z
DTSTART;VALUE=DATE:20260319
DTEND;VALUE=DATE:20260320
SUMMARY:Spring Equinox · Global Calendar Context
DESCRIPTION:Islamic: 1447-09-30 (Ramadan Eve)\nHebrew: 5786-07-01\nOrthodox (Julian): 2026-03-06
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR
```
