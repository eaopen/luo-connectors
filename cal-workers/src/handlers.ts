/**
 * Request handlers for different API endpoints
 */

import { getCacheTTL, getCachedData, setCachedData } from './cache';

interface Env {
  R2_BUCKET: R2Bucket;
  CACHE?: KVNamespace;
}

type RuntimeDay = {
  anchor?: { iso_8601?: string };
  runtime?: { region_code?: string; data_quality?: string };
  metadata?: unknown;
};

type LegacyDayEntry = {
  baseDay?: RuntimeDay;
  isoDate?: string;
  year?: number;
  month?: number;
  anchor?: { iso_8601?: string };
};

type SolarTermOccurrence = {
  local_date?: string;
  occurs_at_utc?: string;
  occurs_at_zoned?: string;
  index?: number;
  major?: boolean;
  name?: string;
};

type ApiMetadata = {
  solar_terms?: {
    zone_id?: string;
    occurrences?: SolarTermOccurrence[];
    today?: SolarTermOccurrence | null;
    next?: SolarTermOccurrence | null;
  };
};

type BadgeMode = 'today' | 'day';

/**
 * Parse Accept-Encoding header
 */
export function acceptsGzip(request: Request): boolean {
  const encoding = request.headers.get('accept-encoding');
  return encoding ? encoding.includes('gzip') : false;
}

/**
 * Get content type based on file extension
 */
export function getContentType(key: string): string {
  if (key.endsWith('.json')) return 'application/json; charset=utf-8';
  if (key.endsWith('.gz')) return 'application/json; charset=utf-8';
  if (key.endsWith('.ics')) return 'text/calendar; charset=utf-8';
  return 'application/json';
}

/**
 * Get cache headers
 */
export function getCacheHeaders(maxAgeSeconds: number = 31536000): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds}`,
    'CDN-Cache-Control': `public, max-age=${maxAgeSeconds}`,
  };
}

/**
 * Get response headers
 */
export function getResponseHeaders(
  useCache: boolean = false,
  contentType: string = 'application/json; charset=utf-8'
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept-Encoding',
  };

  if (useCache) {
    headers['X-Cache'] = 'HIT';
  } else {
    headers['X-Cache'] = 'MISS';
  }

  return headers;
}

/**
 * Handle CORS preflight
 */
export function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept-Encoding',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Error response factory
 */
export function errorResponse(
  message: string,
  status: number = 500
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: getResponseHeaders(),
  });
}

/**
 * Not found response
 */
export function notFoundResponse(date: string): Response {
  return errorResponse(`Calendar data not found for ${date}`, 404);
}

/**
 * Bad request response
 */
export function badRequestResponse(message: string): Response {
  return errorResponse(message, 400);
}

/**
 * Validate ISO date format
 */
export function isValidISODate(date: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;

  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() + 1 === month && d.getDate() === day;
}

/**
 * Build R2 object key for a date
 */
export function getR2Key(year: string, prefersGzip: boolean): string {
  return prefersGzip
    ? `calendar-${year}.json.gz`
    : `calendar-${year}.json`;
}

export function shouldIncludePreciseSolarTermTimes(request: Request): boolean {
  const url = new URL(request.url);
  const includes = url.searchParams.getAll('include')
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase());
  return includes.includes('solar-term-times');
}

function toRuntimeDay(entry: unknown): RuntimeDay | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const legacy = entry as LegacyDayEntry;
  return legacy.baseDay ?? (entry as RuntimeDay);
}

function getEntryIsoDate(entry: unknown): string | null {
  const runtimeDay = toRuntimeDay(entry);
  if (runtimeDay?.anchor?.iso_8601) {
    return runtimeDay.anchor.iso_8601;
  }

  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const legacy = entry as LegacyDayEntry;
  return legacy.isoDate ?? null;
}

function sortDays(days: RuntimeDay[]): RuntimeDay[] {
  return [...days].sort((left, right) => {
    const leftIso = left.anchor?.iso_8601 ?? '';
    const rightIso = right.anchor?.iso_8601 ?? '';
    return leftIso.localeCompare(rightIso);
  });
}

function cloneWithoutMetadata<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => cloneWithoutMetadata(entry)) as T;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const source = value as Record<string, unknown>;
  const clone: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(source)) {
    if (key === 'metadata') {
      continue;
    }
    clone[key] = cloneWithoutMetadata(entry);
  }

  return clone as T;
}

function listYearOccurrences(yearPayload: any): SolarTermOccurrence[] {
  const occurrences = yearPayload?.metadata?.solar_terms?.occurrences;
  return Array.isArray(occurrences) ? occurrences : [];
}

function buildDayMetadata(yearPayload: any, date: string): ApiMetadata | null {
  const yearOccurrences = listYearOccurrences(yearPayload);
  if (!yearOccurrences.length) {
    return null;
  }

  const todaysOccurrences = yearOccurrences.filter((occurrence) => occurrence.local_date === date);
  const today = todaysOccurrences[0] ?? null;
  let next: SolarTermOccurrence | null = null;

  if (today) {
    const index = yearOccurrences.findIndex((occurrence) => occurrence.occurs_at_utc === today.occurs_at_utc);
    next = index >= 0 ? yearOccurrences[index + 1] ?? null : null;
  } else {
    next = yearOccurrences.find((occurrence) => (occurrence.local_date ?? '') > date) ?? null;
  }

  if (!today && !next) {
    return null;
  }

  return {
    solar_terms: {
      zone_id: yearPayload?.metadata?.solar_terms?.zone_id,
      occurrences: today ? todaysOccurrences : [],
      today,
      next,
    },
  };
}

function buildMonthMetadata(yearPayload: any, isoMonth: string): ApiMetadata | null {
  const yearOccurrences = listYearOccurrences(yearPayload);
  if (!yearOccurrences.length) {
    return null;
  }

  const occurrences = yearOccurrences.filter((occurrence) => (occurrence.local_date ?? '').startsWith(`${isoMonth}-`));
  if (!occurrences.length) {
    return null;
  }

  return {
    solar_terms: {
      zone_id: yearPayload?.metadata?.solar_terms?.zone_id,
      occurrences,
      today: null,
      next: null,
    },
  };
}

/**
 * Read text from R2 object, optionally decompressing gzip content
 */
async function readObjectText(object: R2ObjectBody, key: string): Promise<string> {
  const buffer = await object.arrayBuffer();

  if (!key.endsWith('.gz')) {
    return new TextDecoder().decode(buffer);
  }

  const stream = new Response(buffer).body;
  if (!stream) {
    throw new Error(`Failed to read gzip stream for ${key}`);
  }

  const decompressed = stream.pipeThrough(new DecompressionStream('gzip'));
  return await new Response(decompressed).text();
}

/**
 * Extract day from year payload
 */
function getDayFromPayload(
  yearPayload: any,
  date: string
): any | null {
  if (Array.isArray(yearPayload)) {
    for (const entry of yearPayload) {
      if (getEntryIsoDate(entry) === date) {
        return toRuntimeDay(entry);
      }
    }
    return null;
  }

  const isoMonth = date.slice(0, 7);
  const month = yearPayload?.months?.find((m: any) => m.iso_month === isoMonth);
  return month?.days?.find((d: any) => d.anchor?.iso_8601 === date) || null;
}

function getMonthFromPayload(
  yearPayload: any,
  isoMonth: string
): any | null {
  if (Array.isArray(yearPayload)) {
    const [year, month] = isoMonth.split('-').map(Number);
    const days = yearPayload
      .filter((entry: LegacyDayEntry) => entry.year === year && entry.month === month)
      .map((entry: unknown) => toRuntimeDay(entry))
      .filter((day: RuntimeDay | null): day is RuntimeDay => day !== null);
    if (!days.length) return null;

    return {
      year,
      month,
      iso_month: isoMonth,
      region_code: days[0]?.runtime?.region_code ?? 'CN',
      data_quality: days[0]?.runtime?.data_quality ?? 'PRECISE',
      days: sortDays(days),
    };
  }

  return yearPayload?.months?.find((m: any) => m.iso_month === isoMonth) || null;
}

function getYearFromPayload(yearPayload: any, year: string): any | null {
  if (Array.isArray(yearPayload)) {
    const days = yearPayload
      .map((entry: unknown) => toRuntimeDay(entry))
      .filter((day: RuntimeDay | null): day is RuntimeDay => day !== null);
    const grouped = new Map<string, any[]>();

    for (const day of days) {
      const isoMonth = day?.anchor?.iso_8601?.slice(0, 7);
      if (!isoMonth) continue;
      const bucket = grouped.get(isoMonth) ?? [];
      bucket.push(day);
      grouped.set(isoMonth, bucket);
    }

    const months = Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([isoMonth, groupedDays]) => {
        const [groupYear, groupMonth] = isoMonth.split('-').map(Number);
        const sortedDays = sortDays(groupedDays);
        return {
          year: groupYear,
          month: groupMonth,
          iso_month: isoMonth,
          region_code: sortedDays[0]?.runtime?.region_code ?? 'CN',
          data_quality: sortedDays[0]?.runtime?.data_quality ?? 'PRECISE',
          days: sortedDays,
        };
      });

    return {
      year: Number(year),
      region_code: months[0]?.region_code ?? 'CN',
      data_quality: months[0]?.data_quality ?? 'PRECISE',
      months,
    };
  }

  return yearPayload;
}

function formatBadgeDate(date: string): string {
  return date;
}

function getTodayIsoDateInShanghai(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function buildBadgeSvg(label: string, message: string, color: string): string {
  const safeLabel = xmlEscape(label);
  const safeMessage = xmlEscape(message);
  const safeColor = xmlEscape(color);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="40" role="img" aria-label="${safeLabel}: ${safeMessage}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1f2937" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
  </defs>
  <rect width="420" height="40" fill="url(#bg)" rx="8" />
  <rect x="0" y="0" width="130" height="40" fill="#374151" rx="8" />
  <rect x="128" y="0" width="292" height="40" fill="${safeColor}" rx="8" />
  <text x="65" y="26" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="14" fill="#ffffff">${safeLabel}</text>
  <text x="274" y="26" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="14" fill="#ffffff">${safeMessage}</text>
</svg>`.trim();
}

function toBadgeMessage(dayData: any, date: string): string {
  const termName = dayData?.chinese_lunar?.solar_term?.name;
  const countdown = dayData?.chinese_lunar?.solar_term?.countdown;
  if (typeof termName === 'string' && termName.length > 0) {
    if (typeof countdown === 'number') {
      return `${date} · ${termName} · D-${countdown}`;
    }
    return `${date} · ${termName}`;
  }
  return `${date} · Luo Rhythm`;
}

async function getYearPayload(
  year: string,
  env: Env,
  request: Request
): Promise<any | null> {
  const prefersGzip = acceptsGzip(request);
  const keys = prefersGzip
    ? [getR2Key(year, true), getR2Key(year, false)]
    : [getR2Key(year, false), getR2Key(year, true)];

  for (const key of keys) {
    const object = await env.R2_BUCKET.get(key);
    if (!object) {
      continue;
    }

    const actualKey = object.key ?? key;
    const text = await readObjectText(object, actualKey);
    return JSON.parse(text);
  }

  return null;
}

export async function handleBadgeRequest(
  mode: BadgeMode,
  inputDate: string,
  env: Env,
  request: Request
): Promise<Response> {
  try {
    const date = mode === 'today' ? getTodayIsoDateInShanghai() : inputDate;
    const year = date.substring(0, 4);
    const yearPayload = await getYearPayload(year, env, request);

    if (!yearPayload) {
      return notFoundResponse(date);
    }

    const normalizedYear = getYearFromPayload(yearPayload, year);
    const dayData = getDayFromPayload(normalizedYear, date);
    if (!dayData) {
      return notFoundResponse(date);
    }

    const message = toBadgeMessage(dayData, formatBadgeDate(date));
    const svg = buildBadgeSvg('luo', message, '#0ea5e9');

    return new Response(svg, {
      status: 200,
      headers: {
        ...getResponseHeaders(false, 'image/svg+xml; charset=utf-8'),
        ...getCacheHeaders(300),
      },
    });
  } catch (error) {
    console.error('Error processing badge request:', error);
    return errorResponse('Internal server error');
  }
}

/**
 * Handle day request with caching
 */
export async function handleDayRequest(
  date: string,
  env: Env,
  request: Request
): Promise<Response> {
  try {
    const includePreciseSolarTermTimes = shouldIncludePreciseSolarTermTimes(request);
    const cacheKey = includePreciseSolarTermTimes ? `${date}?include=solar-term-times` : date;
    // Check KV cache first
    const cacheTTL = getCacheTTL(date);
    const cached = await getCachedData(env.CACHE, 'day', cacheKey);

    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          ...getResponseHeaders(true),
          ...getCacheHeaders(cacheTTL),
        },
      });
    }

    const year = date.substring(0, 4);
    const yearPayload = await getYearPayload(year, env, request);
    if (!yearPayload) {
      return notFoundResponse(date);
    }

    const normalizedYear = getYearFromPayload(yearPayload, year);
    const dayData = getDayFromPayload(normalizedYear, date);
    if (!dayData) {
      return notFoundResponse(date);
    }

    const responsePayload = includePreciseSolarTermTimes
      ? { ...cloneWithoutMetadata(dayData), metadata: buildDayMetadata(normalizedYear, date) }
      : cloneWithoutMetadata(dayData);

    await setCachedData(env.CACHE, 'day', cacheKey, responsePayload, cacheTTL);

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...getResponseHeaders(),
        ...getCacheHeaders(31536000), // 1 year cache for R2 data
      },
    });
  } catch (error) {
    console.error('Error processing day request:', error);
    return errorResponse('Internal server error');
  }
}

export async function handleMonthRequest(
  isoMonth: string,
  env: Env,
  request: Request
): Promise<Response> {
  try {
    const includePreciseSolarTermTimes = shouldIncludePreciseSolarTermTimes(request);
    const cacheKey = includePreciseSolarTermTimes ? `${isoMonth}?include=solar-term-times` : isoMonth;
    const cacheTTL = getCacheTTL(`${isoMonth}-01`);
    const cached = await getCachedData(env.CACHE, 'month', cacheKey);

    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          ...getResponseHeaders(true),
          ...getCacheHeaders(cacheTTL),
        },
      });
    }

    const year = isoMonth.substring(0, 4);
    const yearPayload = await getYearPayload(year, env, request);
    if (!yearPayload) {
      return notFoundResponse(isoMonth);
    }

    const normalizedYear = getYearFromPayload(yearPayload, year);
    const monthData = getMonthFromPayload(normalizedYear, isoMonth);
    if (!monthData) {
      return notFoundResponse(isoMonth);
    }

    const responsePayload = includePreciseSolarTermTimes
      ? { ...cloneWithoutMetadata(monthData), metadata: buildMonthMetadata(normalizedYear, isoMonth) }
      : cloneWithoutMetadata(monthData);

    await setCachedData(env.CACHE, 'month', cacheKey, responsePayload, cacheTTL);

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...getResponseHeaders(),
        ...getCacheHeaders(31536000),
      },
    });
  } catch (error) {
    console.error('Error processing month request:', error);
    return errorResponse('Internal server error');
  }
}

export async function handleYearRequest(
  year: string,
  env: Env,
  request: Request
): Promise<Response> {
  try {
    const includePreciseSolarTermTimes = shouldIncludePreciseSolarTermTimes(request);
    const cacheKey = includePreciseSolarTermTimes ? `${year}?include=solar-term-times` : year;
    const cacheTTL = 31536000;
    const cached = await getCachedData(env.CACHE, 'year', cacheKey);

    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: {
          ...getResponseHeaders(true),
          ...getCacheHeaders(cacheTTL),
        },
      });
    }

    const yearPayload = await getYearPayload(year, env, request);
    if (!yearPayload) {
      return notFoundResponse(year);
    }

    const normalized = getYearFromPayload(yearPayload, year);
    if (!normalized) {
      return notFoundResponse(year);
    }

    const responsePayload = includePreciseSolarTermTimes ? normalized : cloneWithoutMetadata(normalized);

    await setCachedData(env.CACHE, 'year', cacheKey, responsePayload, cacheTTL);

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...getResponseHeaders(),
        ...getCacheHeaders(cacheTTL),
      },
    });
  } catch (error) {
    console.error('Error processing year request:', error);
    return errorResponse('Internal server error');
  }
}
