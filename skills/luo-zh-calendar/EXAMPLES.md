# Examples

## Query: Today (Chinese)

User:
> 今天是什么日子？给我一个 Obsidian Daily Note 头部片段（YAML + 一句简短提示）。

Assistant output expectations:
- Provide a short human-readable summary first
- Provide a machine-readable payload (GCA-v1 JSON) for tools/plugins
- Keep it lightweight (no images, no rendering)
- If a field is unavailable, keep the key and return null/empty

Suggested YAML:
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

Suggested one-liner:
> 春分前夕，昼夜将平，宜收束杂念，做一次轻量整理。

Suggested JSON (GCA-v1 skeleton):
```json
{
  "version": "1.0",
  "anchor": { "iso_8601": "2026-03-19", "jdn": null, "unix_timestamp": null, "weekday": 4 },
  "chinese_lunar": {
    "cycle": "丙午",
    "animal": "马",
    "month": { "name": "二月", "is_leap": false, "alias": "仲春" },
    "day": "初一",
    "solar_term": { "name": "春分前夕", "next": "春分", "countdown": 1 },
    "phenology": { "pentad": "鹰化为鸠", "note": null }
  },
  "history": { "east_asia": [], "notable_events": [] },
  "religious": { "islamic": null, "hebrew": null, "indian": null, "orthodox": null },
  "synthetic": { "french_republican": null, "stardate": null, "holocene": null },
  "meta": {
    "aesthetic": {
      "traditional_color": { "name": "天青", "hex": "#87B8DE" },
      "visual_keywords": "minimalist peach blossom zen",
      "font_suggestion": "Zhi Mang Xing"
    },
    "ai_hints": { "system_prompt": null, "generation_prompt": null },
    "lifestyle": { "suit": ["塞穴", "整手足甲"], "avoid": ["嫁娶", "作灶"] }
  }
}
```

## Query: Generate ICS overlay

User:
> 给我生成 2026-03-19 的 ICS 单日事件（透明，不占用忙闲）。

Assistant output expectations:
- RFC 5545 compliant text
- `TRANSP:TRANSPARENT`
- Put rich info into `DESCRIPTION`

Minimal ICS:
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
