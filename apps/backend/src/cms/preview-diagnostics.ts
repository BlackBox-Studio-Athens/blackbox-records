import { z } from 'zod';
import { readBoundedText } from './preview-content';
import type { AppLogger } from '../observability';

export const previewDiagnosticsPath = '/_emdash/preview-diagnostics';
const reportSchema = z
  .object({
    requestId: z.string().uuid().optional(),
    release: z.string().regex(/^(?:[a-f0-9]{40}|local|unknown)$/),
    stage: z.enum(['request', 'timeout', 'style', 'image', 'font']),
    asset: z.string().max(1024).optional(),
    directive: z.enum(['style-src', 'style-src-elem', 'img-src', 'font-src']).optional(),
  })
  .strict();

export async function reportPreviewFailure(
  request: Request,
  identity: { email: string; role: number },
  limits: Map<string, { count: number; expires: number }>,
  logger: AppLogger,
) {
  const url = new URL(request.url);
  const headers = { 'Cache-Control': 'private, no-store' };
  if (
    request.method !== 'POST' ||
    identity.role < 30 ||
    url.search ||
    request.headers.get('Origin') !== url.origin ||
    request.headers.get('X-EmDash-Request') !== '1'
  )
    return new Response('Forbidden', { status: 403, headers });
  const now = Date.now();
  for (const [key, value] of limits) if (value.expires <= now) limits.delete(key);
  let budget = limits.get(identity.email);
  // ponytail: per-object in-memory budgets reset on eviction; no durable telemetry storage needed for staff traffic.
  if ((!budget && limits.size >= 1000) || (budget && budget.count >= 10))
    return new Response('Too many reports', { status: 429, headers });
  if (!budget) {
    budget = { count: 0, expires: now + 60_000 };
    limits.set(identity.email, budget);
  }
  budget.count++;
  let report: z.infer<typeof reportSchema>;
  try {
    report = reportSchema.parse(JSON.parse(await readBoundedText(request.body, 4096)));
  } catch {
    return new Response('Invalid report', { status: 400, headers });
  }
  let asset: string | undefined;
  if (report.asset) {
    try {
      const resource = new URL(report.asset, url);
      // Private media filenames/IDs and arbitrary paths must not enter logs.
      if (resource.origin === url.origin) {
        asset = /^\/_astro\/[a-zA-Z0-9_.-]+\.css$/.test(resource.pathname) ? resource.pathname : 'cms-asset';
      } else if (['https://fonts.googleapis.com', 'https://fonts.gstatic.com'].includes(resource.origin)) {
        asset = resource.origin;
      } else asset = 'external-asset';
    } catch {
      asset = 'invalid-asset';
    }
  }
  logger.warn({
    event: 'preview_browser_failure',
    requestId: report.requestId,
    release: report.release,
    stage: report.stage,
    asset,
    directive: report.directive,
  });
  return new Response(null, { status: 204, headers });
}
