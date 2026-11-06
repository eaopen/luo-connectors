import { describe, expect, it } from 'vitest';
import { getCachedData, setCachedData } from './cache';
import { handleDayRequest } from './handlers';

describe('optional cache resilience', () => {
  it('treats broken JSON and read failures as misses', async () => {
    for (const get of [async () => '{', async () => { throw new Error('unavailable'); }]) {
      expect(await getCachedData({ get } as unknown as KVNamespace, 'day', '2026-03-20')).toBeNull();
    }
  });

  it('ignores failed cache fills', async () => {
    const cache = { put: async () => { throw new Error('unavailable'); } } as unknown as KVNamespace;
    await expect(setCachedData(cache, 'day', '2026-03-20', {})).resolves.toBeUndefined();
  });

  it('serves R2 data during a KV outage with the same TTL as a hit', async () => {
    const day = { anchor: { iso_8601: '2026-03-20' } };
    const payload = { months: [{ iso_month: '2026-03', days: [day] }] };
    const request = new Request('https://example.com/v1/day/2026-03-20');
    const broken = async () => { throw new Error('unavailable'); };
    const env = {
      R2_BUCKET: { get: async () => ({ key: 'calendar-2026.json', arrayBuffer: async () => new TextEncoder().encode(JSON.stringify(payload)).buffer }) } as unknown as R2Bucket,
      CACHE: { get: broken, put: broken } as unknown as KVNamespace,
    };
    const miss = await handleDayRequest('2026-03-20', env, request);
    const hit = await handleDayRequest('2026-03-20', { ...env, CACHE: { get: async () => JSON.stringify(day) } as unknown as KVNamespace }, request);
    expect(miss.status).toBe(200);
    expect(await miss.json()).toEqual(day);
    expect(miss.headers.get('Cache-Control')).toBe(hit.headers.get('Cache-Control'));
  });
});
