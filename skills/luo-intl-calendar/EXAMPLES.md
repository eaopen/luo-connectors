# Examples

## Query: Global context (English)

User:
> What is the date in major religious calendars for 2026-03-19? Keep it concise.

Assistant output expectations:
- Provide a short human-readable summary first
- Provide a machine-readable payload (GCA-v1 JSON) for tools/plugins
- Anchor on ISO-8601 (and JDN if available)
- Return `religious` module; keep non-implemented fields as null/empty
- Avoid speculative holidays/events if not backed by data

Example (structure):
```json
{
  "version": "1.0",
  "anchor": { "iso_8601": "2026-03-19", "jdn": null, "unix_timestamp": null, "weekday": null },
  "chinese_lunar": null,
  "history": { "east_asia": [], "notable_events": [] },
  "religious": {
    "islamic": { "date": null, "event": null },
    "hebrew": { "date": null, "event": null },
    "indian": { "standard_saka": null },
    "orthodox": { "julian_date": null }
  },
  "synthetic": { "french_republican": null, "stardate": null, "holocene": null },
  "meta": { "aesthetic": null, "ai_hints": null, "lifestyle": null }
}
```

## Query: Global context (Bilingual)

User:
> Give me ZH + EN output for 2026-03-19 so I can paste it into a meeting note.

Assistant output expectations:
- Keep two short blocks: ZH then EN
- Keep JSON keys stable; bilingual applies to the human-readable text only

## Query: ICS overlay (culture layer)

User:
> Create an iCalendar (.ics) overlay event for 2026-03-19 that won't block availability.

Assistant output expectations:
- RFC 5545 compliant
- `TRANSP:TRANSPARENT`
- Use `DESCRIPTION` for multi-calendar notes

Minimal ICS:
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
DESCRIPTION:Islamic: (pending)\nHebrew: (pending)\nOrthodox (Julian): (pending)
TRANSP:TRANSPARENT
END:VEVENT
END:VCALENDAR
```
