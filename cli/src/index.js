#!/usr/bin/env node

const DEFAULT_BASE_URL = 'https://api-luo.openea.site';

function showHelp() {
  console.log(`Luo Rhythm CLI (minimal)

Usage:
  luo today [--base-url <url>] [--solar-term-times]
  luo day <YYYY-MM-DD> [--base-url <url>] [--solar-term-times]
  luo date <YYYY-MM-DD> [--base-url <url>] [--solar-term-times]
  luo month <YYYY-MM> [--base-url <url>] [--solar-term-times]
  luo year <YYYY> [--base-url <url>] [--solar-term-times]

Options:
  --base-url <url>           Override API base URL (default: ${DEFAULT_BASE_URL})
  --solar-term-times         Append include=solar-term-times query
  -h, --help                 Show help
`);
}

function isValidIsoDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month
    && date.getUTCDate() === day
  );
}

function isValidIsoMonth(value) {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const [year, month] = value.split('-').map(Number);
  return year > 0 && month >= 1 && month <= 12;
}

function isValidYear(value) {
  return /^\d{4}$/.test(value);
}

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseArgs(argv) {
  const args = [...argv];

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    return { help: true };
  }

  let baseUrl = DEFAULT_BASE_URL;
  let includeSolarTermTimes = false;
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--base-url') {
      const url = args[index + 1];
      if (!url) {
        throw new Error('Missing value for --base-url');
      }
      baseUrl = url;
      index += 1;
      continue;
    }

    if (arg.startsWith('--base-url=')) {
      const [, value] = arg.split('=', 2);
      if (!value) {
        throw new Error('Missing value for --base-url');
      }
      baseUrl = value;
      continue;
    }

    if (arg === '--solar-term-times') {
      includeSolarTermTimes = true;
      continue;
    }

    positional.push(arg);
  }

  if (positional.length === 0) {
    return { help: true };
  }

  const [command, value] = positional;
  return {
    help: false,
    command,
    value,
    baseUrl,
    includeSolarTermTimes,
  };
}

function buildPath(parsed) {
  const { command, value } = parsed;

  if (command === 'today') {
    return `/v1/day/${getTodayIsoDate()}`;
  }

  if (command === 'day' || command === 'date') {
    if (!value || !isValidIsoDay(value)) {
      throw new Error('Invalid date. Use YYYY-MM-DD');
    }
    return `/v1/day/${value}`;
  }

  if (command === 'month') {
    if (!value || !isValidIsoMonth(value)) {
      throw new Error('Invalid month. Use YYYY-MM');
    }
    return `/v1/month/${value}`;
  }

  if (command === 'year') {
    if (!value || !isValidYear(value)) {
      throw new Error('Invalid year. Use YYYY');
    }
    return `/v1/year/${value}`;
  }

  throw new Error(`Unknown command: ${command}`);
}

export function resolveRequest(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    return { help: true };
  }

  let base;
  try {
    base = new URL(parsed.baseUrl);
  } catch {
    throw new Error('Invalid --base-url. Must be a valid URL');
  }

  const path = buildPath(parsed);
  const requestUrl = new URL(path, base);

  if (parsed.includeSolarTermTimes) {
    requestUrl.searchParams.set('include', 'solar-term-times');
  }

  return {
    help: false,
    requestUrl: requestUrl.toString(),
  };
}

async function main() {
  try {
    const resolved = resolveRequest(process.argv.slice(2));

    if (resolved.help) {
      showHelp();
      process.exitCode = 0;
      return;
    }

    const response = await fetch(resolved.requestUrl, {
      headers: {
        Accept: 'application/json',
      },
    });

    const text = await response.text();
    let payload;

    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }

    if (!response.ok) {
      console.error(JSON.stringify({
        ok: false,
        status: response.status,
        url: resolved.requestUrl,
        error: payload,
      }, null, 2));
      process.exitCode = 1;
      return;
    }

    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('Run `luo --help` for usage.');
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
