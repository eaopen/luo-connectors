import { describe, expect, it } from 'vitest';

import worker, { isValidYear, isValidYearMonth, parseTarget } from './index';

function createEnv(payloads: Record<string, unknown>) {
  return {
    R2_BUCKET: {
      get: async (key: string) => {
        const payload = payloads[key];
        if (payload === undefined) {
          return null;
        }

        const bytes = new TextEncoder().encode(JSON.stringify(payload));
        return {
          key,
          arrayBuffer: async () => bytes.buffer.slice(0),
        } as unknown as R2Object;
      },
    } as unknown as R2Bucket,
  };
}

describe('index routing', () => {
  it('parses day month and year paths', () => {
    expect(parseTarget('/v1/day/2026-03-20')).toEqual({ kind: 'day', value: '2026-03-20' });
    expect(parseTarget('/v1/month/2026-03')).toEqual({ kind: 'month', value: '2026-03' });
    expect(parseTarget('/v1/year/2026')).toEqual({ kind: 'year', value: '2026' });
    expect(parseTarget('/v1/badge/today')).toEqual({ kind: 'badge_today', value: 'today' });
    expect(parseTarget('/v1/badge/day/2026-03-20')).toEqual({ kind: 'badge_day', value: '2026-03-20' });
  });

  it('validates month and year formats', () => {
    expect(isValidYearMonth('2026-03')).toBe(true);
    expect(isValidYearMonth('2026-13')).toBe(false);
    expect(isValidYear('2026')).toBe(true);
    expect(isValidYear('26')).toBe(false);
  });

  it('routes month requests to the worker handler', async () => {
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
          days: [],
        },
      ],
    };
    const env = createEnv({ 'calendar-2026.json': payload });

    const response = await worker.fetch(
      new Request('https://example.com/v1/month/2026-03'),
      env
    );
    const body = await response.json() as { iso_month: string };

    expect(response.status).toBe(200);
    expect(body.iso_month).toBe('2026-03');
  });

  it('routes badge requests to svg endpoint', async () => {
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

    const response = await worker.fetch(
      new Request('https://example.com/v1/badge/day/2026-03-20'),
      env
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('image/svg+xml');
  });
});
