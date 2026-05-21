/**
 * Luo Rhythm Calendar API - Cloudflare Workers
 *
 * Zero-dependency API serving static files from R2
 */

import {
  handleDayRequest,
  handleMonthRequest,
  handleYearRequest,
  handleBadgeRequest,
  isValidISODate,
  badRequestResponse,
  handleCORS,
} from './handlers';

interface Env {
  R2_BUCKET: R2Bucket;
  CACHE?: KVNamespace;
}

/**
 * Parse request target from URL path
 */
export function parseTarget(
  path: string
): { kind: 'day' | 'month' | 'year' | 'badge_today' | 'badge_day'; value: string } | null {
  const dayMatch = path.match(/^\/v1\/day\/(\d{4}-\d{2}-\d{2})$/);
  if (dayMatch) return { kind: 'day', value: dayMatch[1] };

  const monthMatch = path.match(/^\/v1\/month\/(\d{4}-\d{2})$/);
  if (monthMatch) return { kind: 'month', value: monthMatch[1] };

  const yearMatch = path.match(/^\/v1\/year\/(\d{4})$/);
  if (yearMatch) return { kind: 'year', value: yearMatch[1] };

  const badgeTodayMatch = path.match(/^\/v1\/badge\/today$/);
  if (badgeTodayMatch) return { kind: 'badge_today', value: 'today' };

  const badgeDayMatch = path.match(/^\/v1\/badge\/day\/(\d{4}-\d{2}-\d{2})$/);
  if (badgeDayMatch) return { kind: 'badge_day', value: badgeDayMatch[1] };

  return null;
}

export function isValidYearMonth(value: string): boolean {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(value)) return false;

  const [year, month] = value.split('-').map(Number);
  return year > 0 && month >= 1 && month <= 12;
}

export function isValidYear(value: string): boolean {
  return /^\d{4}$/.test(value);
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Only GET requests allowed
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Parse date from path
    const target = parseTarget(path);
    if (!target) {
      return badRequestResponse(
        'Invalid path. Use /v1/day/YYYY-MM-DD, /v1/month/YYYY-MM, /v1/year/YYYY, /v1/badge/today, or /v1/badge/day/YYYY-MM-DD'
      );
    }

    if (target.kind === 'day') {
      if (!isValidISODate(target.value)) {
        return badRequestResponse('Invalid date format. Use YYYY-MM-DD');
      }
      return handleDayRequest(target.value, env, request);
    }

    if (target.kind === 'month') {
      if (!isValidYearMonth(target.value)) {
        return badRequestResponse('Invalid month format. Use YYYY-MM');
      }
      return handleMonthRequest(target.value, env, request);
    }

    if (target.kind === 'badge_today') {
      return handleBadgeRequest('today', target.value, env, request);
    }

    if (target.kind === 'badge_day') {
      if (!isValidISODate(target.value)) {
        return badRequestResponse('Invalid date format. Use YYYY-MM-DD');
      }
      return handleBadgeRequest('day', target.value, env, request);
    }

    if (!isValidYear(target.value)) {
      return badRequestResponse('Invalid year format. Use YYYY');
    }

    return handleYearRequest(target.value, env, request);
  },
};
