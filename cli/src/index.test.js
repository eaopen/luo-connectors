import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveRequest } from './index.js';

test('resolveRequest shows help without args', () => {
  const resolved = resolveRequest([]);
  assert.equal(resolved.help, true);
});

test('resolveRequest builds day URL', () => {
  const resolved = resolveRequest(['day', '2026-03-20']);
  assert.equal(resolved.help, false);
  assert.equal(resolved.requestUrl, 'https://api-luo.openea.site/v1/day/2026-03-20');
});

test('resolveRequest builds month URL with include flag', () => {
  const resolved = resolveRequest(['month', '2026-03', '--solar-term-times']);
  assert.equal(resolved.help, false);
  assert.equal(
    resolved.requestUrl,
    'https://api-luo.openea.site/v1/month/2026-03?include=solar-term-times'
  );
});

test('resolveRequest supports today command', () => {
  const resolved = resolveRequest(['today']);
  assert.equal(resolved.help, false);
  assert.match(resolved.requestUrl, /^https:\/\/api-luo\.openea\.site\/v1\/day\/\d{4}-\d{2}-\d{2}$/);
});

test('resolveRequest validates date format', () => {
  assert.throws(() => resolveRequest(['day', '2026-13-40']), /Invalid date/);
});

test('resolveRequest supports custom base URL', () => {
  const resolved = resolveRequest(['year', '2026', '--base-url', 'http://localhost:8787']);
  assert.equal(resolved.help, false);
  assert.equal(resolved.requestUrl, 'http://localhost:8787/v1/year/2026');
});
