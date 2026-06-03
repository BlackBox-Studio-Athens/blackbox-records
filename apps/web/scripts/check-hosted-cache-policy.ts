import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const defaultHostedCacheAuditSiteUrl = 'https://blackbox-records-web.pages.dev';
export const defaultHostedCacheAuditWorkerUrl = 'https://blackbox-records-backend.blackboxrecordsathens.workers.dev';
export const defaultHostedCacheAuditStoreItemSlug = 'disintegration-black-vinyl-lp';
export const defaultHostedCacheAuditOverlayPath = '/app-shell-overlay/releases/disintegration/';
export const hostedCacheAuditRequestBudget = 6;

export type HostedCacheAuditOptions = {
  assetUrl?: string;
  overlayPath: string;
  siteUrl: string;
  storeItemSlug: string;
  timeoutMs: number;
  workerUrl: string;
};

export type HostedCacheAuditTargetKind =
  | 'hashed-asset'
  | 'route-document'
  | 'overlay-partial'
  | 'store-capabilities'
  | 'store-offer';

export type HostedCacheAuditTarget = {
  canTouchD1: boolean;
  canTouchWorker: boolean;
  kind: HostedCacheAuditTargetKind;
  label: string;
  url: string;
};

export type HostedCacheAuditTargetResult = HostedCacheAuditTarget & {
  cacheControl: string | null;
  cfCacheStatus: string | null;
  contentType: string | null;
  error: string | null;
  issues: string[];
  issueCount: number;
  note: string | null;
  skipped: boolean;
  status: number | null;
  etag: string | null;
};

export type HostedCacheAuditRun = {
  discoveryNote: string | null;
  issues: string[];
  requestCount: number;
  results: HostedCacheAuditTargetResult[];
  siteUrl: string;
  workerUrl: string;
};

type FetchLike = (input: URL | string, init?: RequestInit) => Promise<Response>;

const defaultStoreDocumentPath = '/store/';

export function parseHostedCacheAuditArgs(args: string[]): HostedCacheAuditOptions {
  let assetUrl: string | undefined;
  let overlayPath = defaultHostedCacheAuditOverlayPath;
  let siteUrl = defaultHostedCacheAuditSiteUrl;
  let storeItemSlug = defaultHostedCacheAuditStoreItemSlug;
  let timeoutMs = 10_000;
  let workerUrl = defaultHostedCacheAuditWorkerUrl;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg || arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (arg === '--site-url') {
      siteUrl = requireValue('--site-url', args[++index]);
      continue;
    }

    if (arg.startsWith('--site-url=')) {
      siteUrl = requireValue('--site-url', arg.slice('--site-url='.length));
      continue;
    }

    if (arg === '--worker-url') {
      workerUrl = requireValue('--worker-url', args[++index]);
      continue;
    }

    if (arg.startsWith('--worker-url=')) {
      workerUrl = requireValue('--worker-url', arg.slice('--worker-url='.length));
      continue;
    }

    if (arg === '--store-item-slug') {
      storeItemSlug = requireValue('--store-item-slug', args[++index]);
      continue;
    }

    if (arg.startsWith('--store-item-slug=')) {
      storeItemSlug = requireValue('--store-item-slug', arg.slice('--store-item-slug='.length));
      continue;
    }

    if (arg === '--overlay-path') {
      overlayPath = requireValue('--overlay-path', args[++index]);
      continue;
    }

    if (arg.startsWith('--overlay-path=')) {
      overlayPath = requireValue('--overlay-path', arg.slice('--overlay-path='.length));
      continue;
    }

    if (arg === '--asset-url') {
      assetUrl = requireValue('--asset-url', args[++index]);
      continue;
    }

    if (arg.startsWith('--asset-url=')) {
      assetUrl = requireValue('--asset-url', arg.slice('--asset-url='.length));
      continue;
    }

    if (arg === '--timeout-ms') {
      timeoutMs = parseTimeoutMs(requireValue('--timeout-ms', args[++index]));
      continue;
    }

    if (arg.startsWith('--timeout-ms=')) {
      timeoutMs = parseTimeoutMs(arg.slice('--timeout-ms='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    ...(assetUrl ? { assetUrl } : {}),
    overlayPath: normalizeAuditPath(overlayPath, true),
    siteUrl: normalizeBaseUrl(siteUrl),
    storeItemSlug: storeItemSlug.trim(),
    timeoutMs,
    workerUrl: normalizeBaseUrl(workerUrl),
  };
}

export function buildHostedCacheAuditTargets(options: HostedCacheAuditOptions): HostedCacheAuditTarget[] {
  const storeItemPath = `${defaultStoreDocumentPath}${encodeURIComponent(options.storeItemSlug)}/`;

  return [
    {
      canTouchD1: false,
      canTouchWorker: false,
      kind: 'hashed-asset',
      label: 'Hashed Astro asset',
      url: options.assetUrl ?? '',
    },
    {
      canTouchD1: false,
      canTouchWorker: false,
      kind: 'route-document',
      label: 'Store route document',
      url: resolveUrl(options.siteUrl, storeItemPath),
    },
    {
      canTouchD1: false,
      canTouchWorker: false,
      kind: 'overlay-partial',
      label: 'Overlay partial',
      url: resolveUrl(options.siteUrl, options.overlayPath),
    },
    {
      canTouchD1: false,
      canTouchWorker: true,
      kind: 'store-capabilities',
      label: 'Store capabilities',
      url: resolveUrl(options.workerUrl, '/api/store/capabilities'),
    },
    {
      canTouchD1: true,
      canTouchWorker: true,
      kind: 'store-offer',
      label: 'Store offer',
      url: resolveUrl(options.workerUrl, `/api/store/items/${encodeURIComponent(options.storeItemSlug)}`),
    },
  ];
}

export async function runHostedCacheAudit(
  options: HostedCacheAuditOptions,
  fetchImpl: FetchLike = fetch,
): Promise<HostedCacheAuditRun> {
  const results: HostedCacheAuditTargetResult[] = [];
  const issues: string[] = [];
  let requestCount = 0;
  let discoveryNote: string | null;

  let assetUrl = options.assetUrl?.trim() || '';
  if (!assetUrl) {
    const discovery = await fetchAuditResponse(resolveUrl(options.siteUrl, '/'), fetchImpl, options.timeoutMs, {
      accept: 'text/html',
    });
    requestCount += 1;

    if (discovery.error) {
      discoveryNote = `Skipped hashed asset discovery: ${discovery.error}`;
    } else {
      const discoveredAssetPath = extractFirstAstroAssetPath(await readResponseText(discovery.response!));
      if (discoveredAssetPath) {
        assetUrl = resolveUrl(options.siteUrl, discoveredAssetPath);
        discoveryNote = `Discovered hashed asset: ${assetUrl}`;
      } else {
        discoveryNote = 'Skipped hashed asset audit: no /_astro/ asset reference found in the site root HTML.';
      }
    }
  } else {
    discoveryNote = `Asset URL provided directly: ${assetUrl}`;
  }

  const targets = buildHostedCacheAuditTargets({ ...options, assetUrl });
  for (const target of targets) {
    if (!target.url) {
      results.push({
        ...target,
        cacheControl: null,
        cfCacheStatus: null,
        contentType: null,
        error: 'No asset URL was available for the hashed asset audit target.',
        etag: null,
        issues: ['No asset URL was available for the hashed asset audit target.'],
        issueCount: 1,
        note: discoveryNote,
        skipped: true,
        status: null,
      });
      issues.push('No asset URL was available for the hashed asset audit target.');
      continue;
    }

    const response = await fetchAuditResponse(target.url, fetchImpl, options.timeoutMs, {
      accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
    });
    requestCount += 1;

    if (response.error) {
      results.push({
        ...target,
        cacheControl: null,
        cfCacheStatus: null,
        contentType: null,
        error: response.error,
        etag: null,
        issues: [response.error],
        issueCount: 1,
        note: discoveryNote,
        skipped: false,
        status: null,
      });
      issues.push(response.error);
      continue;
    }

    const result = evaluateTarget(target, response.response!, discoveryNote);
    results.push(result);
    issues.push(...result.issues);
  }

  return {
    discoveryNote,
    issues,
    requestCount,
    results,
    siteUrl: options.siteUrl,
    workerUrl: options.workerUrl,
  };
}

export function formatHostedCacheAuditReport(run: HostedCacheAuditRun): string {
  const lines: string[] = [];

  lines.push('Hosted cache audit');
  lines.push(`Site URL: ${run.siteUrl}`);
  lines.push(`Worker URL: ${run.workerUrl}`);
  lines.push(`Request budget: ${hostedCacheAuditRequestBudget} requests max; this run used ${run.requestCount}.`);

  if (run.discoveryNote) {
    lines.push(`Discovery: ${run.discoveryNote}`);
  }

  for (const result of run.results) {
    lines.push('');
    lines.push(`[${result.label}] ${result.url}`);
    lines.push(`  kind: ${result.kind}`);
    lines.push(`  touches worker: ${result.canTouchWorker ? 'yes' : 'no'}`);
    lines.push(`  touches D1: ${result.canTouchD1 ? 'yes' : 'no'}`);
    lines.push(`  status: ${result.skipped ? 'skipped' : result.error ? 'error' : (result.status ?? 'unknown')}`);
    if (result.cacheControl) lines.push(`  cache-control: ${result.cacheControl}`);
    if (result.etag) lines.push(`  etag: ${result.etag}`);
    if (result.cfCacheStatus) lines.push(`  cf-cache-status: ${result.cfCacheStatus}`);
    if (result.contentType) lines.push(`  content-type: ${result.contentType}`);
    if (result.note) lines.push(`  note: ${result.note}`);
    if (result.error) lines.push(`  error: ${result.error}`);
    if (result.issues.length > 0) {
      for (const issue of result.issues) {
        lines.push(`  issue: ${issue}`);
      }
    }
    if (result.issueCount > 0) lines.push(`  issues: ${result.issueCount}`);
  }

  lines.push('');
  lines.push(`Summary: ${run.issues.length > 0 ? 'issues found' : 'no issues found'}`);
  return lines.join('\n');
}

export function extractFirstAstroAssetPath(html: string): string | null {
  const match = /\/_astro\/[A-Za-z0-9._-]+\.[A-Za-z0-9_-]+\.(?:css|js|webp|png|jpe?g|gif|svg|avif|woff2?)/.exec(html);
  return match?.[0] ?? null;
}

function evaluateTarget(
  target: HostedCacheAuditTarget,
  response: Response,
  note: string | null,
): HostedCacheAuditTargetResult {
  const cacheControl = response.headers.get('cache-control');
  const etag = response.headers.get('etag');
  const cfCacheStatus = response.headers.get('cf-cache-status');
  const contentType = response.headers.get('content-type');
  const issues = evaluateResponsePolicy(target, response.status, cacheControl);

  return {
    ...target,
    cacheControl,
    cfCacheStatus,
    contentType,
    error: null,
    etag,
    issues,
    issueCount: issues.length,
    note,
    skipped: false,
    status: response.status,
  };
}

function evaluateResponsePolicy(target: HostedCacheAuditTarget, status: number, cacheControl: string | null): string[] {
  const issues: string[] = [];

  if (status < 200 || status >= 400) {
    issues.push(`Expected a successful response, but received status ${status}.`);
  }

  switch (target.kind) {
    case 'hashed-asset': {
      if (!cacheControl) {
        issues.push('Expected Cache-Control for hashed asset, but the response did not include one.');
        break;
      }

      if (!/immutable/i.test(cacheControl) || !/max-age=31536000/i.test(cacheControl)) {
        issues.push(`Expected immutable hashing policy for the asset, but found "${cacheControl}".`);
      }
      break;
    }
    case 'route-document':
    case 'overlay-partial': {
      if (cacheControl && (/immutable/i.test(cacheControl) || /max-age=31536000/i.test(cacheControl))) {
        issues.push(`Immutable caching is not allowed for ${target.kind} responses, but found "${cacheControl}".`);
      }
      break;
    }
    case 'store-capabilities': {
      if (!cacheControl) {
        issues.push('Expected Cache-Control: no-store for the store capabilities response.');
        break;
      }

      if (!cacheControl.toLowerCase().includes('no-store')) {
        issues.push(
          `Expected Cache-Control: no-store for the store capabilities response, but found "${cacheControl}".`,
        );
      }
      break;
    }
    case 'store-offer': {
      if (!cacheControl) {
        issues.push('Expected Cache-Control: no-store for the public store offer response.');
        break;
      }

      if (!cacheControl.toLowerCase().includes('no-store')) {
        issues.push(
          `Expected Cache-Control: no-store for the public store offer response, but found "${cacheControl}".`,
        );
      }
      break;
    }
  }

  return issues;
}

async function fetchAuditResponse(
  url: string,
  fetchImpl: FetchLike,
  timeoutMs: number,
  headers: HeadersInit,
): Promise<{ error: string | null; response: Response | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      headers,
      signal: controller.signal,
    });
    return { error: null, response };
  } catch (error) {
    return { error: formatError(error), response: null };
  } finally {
    clearTimeout(timer);
  }
}

async function readResponseText(response: Response): Promise<string> {
  return response.text();
}

function normalizeAuditPath(pathname: string, preserveLeadingSlash = false): string {
  const trimmed = pathname.trim();
  if (!trimmed) {
    throw new Error('Audit path must not be empty.');
  }

  const pathWithSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const normalized = pathWithSlash.replace(/\/+$/, '/');
  return preserveLeadingSlash ? normalized : normalized.replace(/^\//, '');
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  const pathname = url.pathname.replace(/\/+$/, '');
  return `${url.origin}${pathname || ''}${url.search}${url.hash}`;
}

function resolveUrl(baseUrl: string, pathname: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const relativePath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  return new URL(relativePath, normalizedBase).toString();
}

function requireValue(name: string, value: string | undefined): string {
  if (value === undefined || value.trim() === '') {
    throw new Error(`${name} requires a value.`);
  }

  return value;
}

function parseTimeoutMs(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('--timeout-ms must be a positive integer.');
  }

  return parsed;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function printUsage(): void {
  console.log(
    [
      'Usage: pnpm cache:policy:hosted-audit -- [--site-url <url>] [--worker-url <url>] [--store-item-slug <slug>] [--overlay-path <path>] [--asset-url <url>] [--timeout-ms <ms>]',
      'Audits a bounded set of PRD cache-policy URLs without mutating provider state.',
      `Request budget: ${hostedCacheAuditRequestBudget} fetches max, including one optional discovery fetch for the hashed Astro asset.`,
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  const options = parseHostedCacheAuditArgs(process.argv.slice(2));
  const run = await runHostedCacheAudit(options);
  const report = formatHostedCacheAuditReport(run);
  console.log(report);

  if (run.issues.length > 0) {
    throw new Error(`Hosted cache audit failed with ${run.issues.length} issue(s).`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(formatError(error));
    process.exitCode = 1;
  });
}
