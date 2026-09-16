import { describe, expect, it, vi } from 'vitest';
import { previewPolicy } from '../../src/cms/preview-policy';
import { reportPreviewFailure } from '../../src/cms/preview-diagnostics';

describe('private preview diagnostics', () => {
  const origin = 'https://staff-uat.blackboxrecordsathens.com';
  const identity = { email: 'member@example.test', role: 30 };
  const body = {
    requestId: '00000000-0000-4000-8000-000000000001',
    release: 'local',
    stage: 'style',
    asset: `${origin}/_astro/preview.abc.css?secret=hidden`,
    directive: 'style-src-elem',
  };
  function setup() {
    const limits = new Map<string, { count: number; expires: number }>();
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const send = (data: unknown = body, headers: Record<string, string> = {}, role = 30, method = 'POST') =>
      reportPreviewFailure(
        new Request(`${origin}/_emdash/preview-diagnostics`, {
          method,
          headers: { Origin: origin, 'X-EmDash-Request': '1', ...headers },
          ...(method === 'POST' ? { body: typeof data === 'string' ? data : JSON.stringify(data) } : {}),
        }),
        { ...identity, role },
        limits,
        logger,
      );
    return { limits, logger, send };
  }
  it('uses explicit trusted origins and retains isolation', () => {
    expect(previewPolicy(origin)).toContain(`style-src ${origin} 'unsafe-inline'`);
    expect(previewPolicy('http://127.0.0.1:8787')).toContain('img-src http://127.0.0.1:8787');
    expect(previewPolicy(origin)).toContain(
      "script-src 'none'; connect-src 'none'; frame-src 'none'; form-action 'none'",
    );
    expect(() => previewPolicy('http://attacker.test')).toThrow();
    expect(() => previewPolicy('data:text/html,hi')).toThrow();
  });
  it('logs only safe correlated failure fields', async () => {
    const { send, logger } = setup();
    expect((await send()).status).toBe(204);
    expect(logger.warn).toHaveBeenCalledWith({
      event: 'preview_browser_failure',
      requestId: body.requestId,
      release: 'local',
      stage: 'style',
      asset: '/_astro/preview.abc.css',
      directive: 'style-src-elem',
    });
    await send({ ...body, asset: `${origin}/_emdash/api/media/file/private-photo.jpg?token=secret` });
    expect(logger.warn.mock.calls[1][0].asset).toBe('cms-asset');
    expect(JSON.stringify(logger.warn.mock.calls)).not.toMatch(/secret|private-photo|member@/);
  });
  it('rejects invalid payloads and unauthorized reports without logging', async () => {
    const { send, logger } = setup();
    expect((await send(body, { Origin: 'https://attacker.test' })).status).toBe(403);
    expect((await send(body, { 'X-EmDash-Request': '' })).status).toBe(403);
    expect((await send(body, {}, 10)).status).toBe(403);
    expect((await send(body, {}, 30, 'GET')).status).toBe(403);
    expect((await send({ ...body, html: 'private' })).status).toBe(400);
    expect((await send(' '.repeat(4097))).status).toBe(400);
    expect((await send({ ...body, directive: 'anything' })).status).toBe(400);
    expect(logger.warn).not.toHaveBeenCalled();
  });
  it('accepts bounded generation evidence without editorial data', async () => {
    const { send, logger } = setup();
    expect(
      (await send({ ...body, stage: 'freshness', requestedGeneration: 4, displayedGeneration: 2, readiness: 'failed' }))
        .status,
    ).toBe(204);
    expect(logger.warn.mock.calls[0][0]).toMatchObject({
      stage: 'freshness',
      requestedGeneration: 4,
      displayedGeneration: 2,
      readiness: 'failed',
    });
    expect((await send({ ...body, requestedGeneration: 'private text' })).status).toBe(400);
    expect((await send({ ...body, requestedGeneration: -1 })).status).toBe(400);
  });
  it('caps reports and bounds the in-memory identity map', async () => {
    const { send, logger, limits } = setup();
    for (let i = 0; i < 10; i++) expect((await send()).status).toBe(204);
    expect((await send()).status).toBe(429);
    expect(logger.warn).toHaveBeenCalledTimes(10);
    limits.get(identity.email)!.expires = 0;
    expect((await send()).status).toBe(204);
    limits.clear();
    for (let i = 0; i < 1000; i++) limits.set(String(i), { expires: Date.now() + 60_000, count: 1 });
    expect((await send()).status).toBe(429);
    expect(limits.size).toBe(1000);
  });
});
