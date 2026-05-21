import { describe, expect, it } from 'vitest';

import {
  handleDayRequest,
  handleMonthRequest,
  handleYearRequest,
  handleBadgeRequest,
  shouldIncludePreciseSolarTermTimes,
} from './handlers';

function createR2Object(payload: unknown, key: string): R2ObjectBody {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);

  return {
    key,
    arrayBuffer: async () => bytes.buffer.slice(0),
  } as unknown as R2ObjectBody;
}

function createEnv(payloads: Record<string, unknown>) {
  return {
    R2_BUCKET: {
      get: async (key: string) => {
        const payload = payloads[key];
        if (payload === undefined) {
          return null;
        }
        return createR2Object(payload, key);
      },
    } as unknown as R2Bucket,
  };
}

describe('handlers', () => {
  it('reads legacy day arrays through baseDay', async () => {
    const payload = [
      {
        baseDay: {
          anchor: { iso_8601: '2026-03-20' },
          runtime: { region_code: 'CN', data_quality: 'PRECISE' },
        },
        year: 2026,
        month: 3,
        day: 20,
        isoDate: '2026-03-20',
      },
    ];
    const env = createEnv({ 'calendar-2026.json': payload });

    const response = await handleDayRequest(
      '2026-03-20',
      env,
      new Request('https://example.com/v1/day/2026-03-20')
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload[0].baseDay);
  });

  it('reads month data from year-pack payloads', async () => {
    const payload = {
      year: 2026,
      region_code: 'CN',
      data_quality: 'PRECISE',
      months: [
        {
          year: 2026,
          month: 3,
          iso_month: '2026-03',
          region_code: 'CN',
          data_quality: 'PRECISE',
          days: [
            { anchor: { iso_8601: '2026-03-20' }, runtime: { region_code: 'CN', data_quality: 'PRECISE' } },
          ],
        },
      ],
    };
    const env = createEnv({ 'calendar-2026.json': payload });

    const response = await handleMonthRequest(
      '2026-03',
      env,
      new Request('https://example.com/v1/month/2026-03')
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload.months[0]);
  });

  it('normalizes legacy year arrays into grouped months', async () => {
    const payload = [
      {
        baseDay: {
          anchor: { iso_8601: '2026-03-21' },
          runtime: { region_code: 'CN', data_quality: 'PRECISE' },
        },
        year: 2026,
        month: 3,
        isoDate: '2026-03-21',
      },
      {
        baseDay: {
          anchor: { iso_8601: '2026-03-20' },
          runtime: { region_code: 'CN', data_quality: 'PRECISE' },
        },
        year: 2026,
        month: 3,
        isoDate: '2026-03-20',
      },
    ];
    const env = createEnv({ 'calendar-2026.json': payload });

    const response = await handleYearRequest(
      '2026',
      env,
      new Request('https://example.com/v1/year/2026')
    );
    const body = await response.json() as {
      year: number;
      months: Array<{ days: Array<{ anchor: { iso_8601: string } }> }>;
    };

    expect(response.status).toBe(200);
    expect(body.year).toBe(2026);
    expect(body.months).toHaveLength(1);
    expect(body.months[0].days.map((day: { anchor: { iso_8601: string } }) => day.anchor.iso_8601)).toEqual([
      '2026-03-20',
      '2026-03-21',
    ]);
  });

  it('detects optional precise solar term include flag', () => {
    expect(
      shouldIncludePreciseSolarTermTimes(new Request('https://example.com/v1/day/2026-03-20?include=solar-term-times'))
    ).toBe(true);
    expect(
      shouldIncludePreciseSolarTermTimes(new Request('https://example.com/v1/day/2026-03-20'))
    ).toBe(false);
  });

  it('returns precise solar term metadata only when requested', async () => {
    const payload = {
      year: 2026,
      region_code: 'CN',
      data_quality: 'PRECISE',
      metadata: {
        solar_terms: {
          zone_id: 'Asia/Shanghai',
          occurrences: [
            {
              index: 2,
              major: true,
              name: '春分',
              local_date: '2026-03-20',
              occurs_at_utc: '2026-03-20T09:01:00Z',
              occurs_at_zoned: '2026-03-20T17:01:00+08:00',
            },
            {
              index: 3,
              major: false,
              name: '清明',
              local_date: '2026-04-04',
              occurs_at_utc: '2026-04-04T08:00:00Z',
              occurs_at_zoned: '2026-04-04T16:00:00+08:00',
            },
          ],
        },
      },
      months: [
        {
          year: 2026,
          month: 3,
          iso_month: '2026-03',
          region_code: 'CN',
          data_quality: 'PRECISE',
          days: [
            { anchor: { iso_8601: '2026-03-20' }, runtime: { region_code: 'CN', data_quality: 'PRECISE' } },
          ],
        },
      ],
    };
    const env = createEnv({ 'calendar-2026.json': payload });

    const defaultDay = await handleDayRequest(
      '2026-03-20',
      env,
      new Request('https://example.com/v1/day/2026-03-20')
    );
    expect((await defaultDay.json()) as { metadata?: unknown }).not.toHaveProperty('metadata');

    const preciseDay = await handleDayRequest(
      '2026-03-20',
      env,
      new Request('https://example.com/v1/day/2026-03-20?include=solar-term-times')
    );
    const preciseDayBody = await preciseDay.json() as { metadata?: { solar_terms?: { today?: { name?: string }, next?: { name?: string } } } };
    expect(preciseDayBody.metadata?.solar_terms?.today?.name).toBe('春分');
    expect(preciseDayBody.metadata?.solar_terms?.next?.name).toBe('清明');

    const preciseMonth = await handleMonthRequest(
      '2026-03',
      env,
      new Request('https://example.com/v1/month/2026-03?include=solar-term-times')
    );
    const preciseMonthBody = await preciseMonth.json() as { metadata?: { solar_terms?: { occurrences?: Array<{ name?: string }> } } };
    expect(preciseMonthBody.metadata?.solar_terms?.occurrences?.map((term) => term.name)).toEqual(['春分']);

    const preciseYear = await handleYearRequest(
      '2026',
      env,
      new Request('https://example.com/v1/year/2026?include=solar-term-times')
    );
    const preciseYearBody = await preciseYear.json() as { metadata?: { solar_terms?: { occurrences?: Array<{ name?: string }> } } };
    expect(preciseYearBody.metadata?.solar_terms?.occurrences?.map((term) => term.name)).toEqual(['春分', '清明']);
  });

  it('returns SVG badge for explicit day', async () => {
    const payload = {
      year: 2026,
      region_code: 'CN',
      data_quality: 'PRECISE',
      months: [
        {
          year: 2026,
          month: 3,
          iso_month: '2026-03',
          region_code: 'CN',
          data_quality: 'PRECISE',
          days: [
            {
              anchor: { iso_8601: '2026-03-20' },
              chinese_lunar: {
                solar_term: {
                  name: '春分',
                  countdown: 0,
                },
              },
              runtime: { region_code: 'CN', data_quality: 'PRECISE' },
            },
          ],
        },
      ],
    };
    const env = createEnv({ 'calendar-2026.json': payload });

    const response = await handleBadgeRequest(
      'day',
      '2026-03-20',
      env,
      new Request('https://example.com/v1/badge/day/2026-03-20')
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');

    const svg = await response.text();
    expect(svg).toContain('<svg');
    expect(svg).toContain('2026-03-20');
    expect(svg).toContain('春分');
  });
});
