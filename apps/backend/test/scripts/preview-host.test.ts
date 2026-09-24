import { expect, test, vi } from 'vitest';
import type { AppBindings } from '../../src/env';
import { authenticatePreview, isPreviewHost, previewOrigin, previewSessionResponse } from '../../src/cms/preview-host';
import { verifyOperatorAccess } from '../../src/interfaces/http/auth';

vi.mock('../../src/interfaces/http/auth', () => ({ verifyOperatorAccess: vi.fn() }));

test.each(['preview-audience', 'staff-audience'])(
  'preview authentication uses its exact isolated host with audience %s',
  async (audience) => {
    const bindings = {
      PRODUCT_ENVIRONMENT: 'UAT',
      CMS_HOSTNAME: 'staff.example.com',
      CMS_PREVIEW_HOSTNAME: 'preview.example.com',
      CMS_PREVIEW_POLICY_AUD: audience,
      CF_ACCESS_POLICY_AUD: 'staff-audience',
    } as AppBindings & { CMS_HOSTNAME: string; CMS_PREVIEW_HOSTNAME: string; CMS_PREVIEW_POLICY_AUD: string };
    vi.mocked(verifyOperatorAccess).mockResolvedValue({
      status: 'verified',
      identity: { email: 'member@example.com' },
    });
    const request = new Request('https://preview.example.com/');
    expect(isPreviewHost(request, bindings)).toBe(true);
    await expect(authenticatePreview(request, bindings)).resolves.toEqual({ email: 'member@example.com' });
    expect(verifyOperatorAccess).toHaveBeenLastCalledWith(
      request,
      expect.objectContaining({ CF_ACCESS_POLICY_AUD: audience }),
    );
    for (const origin of ['https://staff.example.com', 'https://alternate.example.com', 'http://preview.example.com'])
      await expect(authenticatePreview(new Request(origin), bindings)).rejects.toThrow('hostname');
    expect(() =>
      previewOrigin({ ...bindings, CMS_PREVIEW_HOSTNAME: bindings.CMS_HOSTNAME }, new URL(request.url)),
    ).toThrow('not configured');
    vi.mocked(verifyOperatorAccess).mockResolvedValue({ status: 'unauthorized', reason: 'missing_token' });
    await expect(authenticatePreview(request, bindings)).rejects.toThrow('Sign in');
  },
);

test('Local preview keeps an isolated hostname while retaining the selected Local port', () => {
  const bindings = { PRODUCT_ENVIRONMENT: 'LOCAL' } as AppBindings;
  expect(previewOrigin(bindings, new URL('http://127.0.0.1:8799/'))).toBe('http://localhost:8799');
  expect(isPreviewHost(new Request('http://127.0.0.1:8799/'), bindings)).toBe(false);
});

test('preview session requires Access and allows only the staff origin to check it', async () => {
  const bindings = {
    PRODUCT_ENVIRONMENT: 'UAT',
    CMS_HOSTNAME: 'staff.example.com',
    CMS_PREVIEW_HOSTNAME: 'preview.example.com',
    CMS_PREVIEW_POLICY_AUD: 'preview-audience',
  } as AppBindings & { CMS_HOSTNAME: string; CMS_PREVIEW_HOSTNAME: string; CMS_PREVIEW_POLICY_AUD: string };
  const request = (origin?: string) =>
    new Request('https://preview.example.com/_preview/session', {
      headers: { Accept: 'application/json', ...(origin ? { Origin: origin } : {}) },
    });
  vi.mocked(verifyOperatorAccess).mockResolvedValue({ status: 'unauthorized', reason: 'missing_token' });
  await expect(previewSessionResponse(request('https://staff.example.com'), bindings)).rejects.toThrow('Sign in');
  vi.mocked(verifyOperatorAccess).mockResolvedValue({ status: 'verified', identity: { email: 'member@example.com' } });
  const response = await previewSessionResponse(request('https://staff.example.com'), bindings);
  expect(response.status).toBe(204);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://staff.example.com');
  expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  const denied = await previewSessionResponse(request('https://attacker.example'), bindings);
  expect(denied.status).toBe(403);
  expect(denied.headers.has('Access-Control-Allow-Origin')).toBe(false);
  const signIn = await previewSessionResponse(new Request('https://preview.example.com/_preview/session'), bindings);
  expect(await signIn.text()).toContain('Preview sign-in complete');
  expect(signIn.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
});
