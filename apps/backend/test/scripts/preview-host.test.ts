import { expect, test, vi } from 'vitest';
import type { AppBindings } from '../../src/env';
import { authenticatePreview, isPreviewHost, previewOrigin } from '../../src/cms/preview-host';
import { verifyOperatorAccess } from '../../src/interfaces/http/auth';

vi.mock('../../src/interfaces/http/auth', () => ({ verifyOperatorAccess: vi.fn() }));

test('preview authentication uses its exact isolated host and Access audience', async () => {
  const bindings = {
    PRODUCT_ENVIRONMENT: 'UAT',
    CMS_HOSTNAME: 'staff.example.com',
    CMS_PREVIEW_HOSTNAME: 'preview.example.com',
    CMS_PREVIEW_POLICY_AUD: 'preview-audience',
    CF_ACCESS_POLICY_AUD: 'staff-audience',
  } as AppBindings & { CMS_HOSTNAME: string; CMS_PREVIEW_HOSTNAME: string; CMS_PREVIEW_POLICY_AUD: string };
  vi.mocked(verifyOperatorAccess).mockResolvedValue({ status: 'verified', identity: { email: 'member@example.com' } });
  const request = new Request('https://preview.example.com/');
  expect(isPreviewHost(request, bindings)).toBe(true);
  await expect(authenticatePreview(request, bindings)).resolves.toEqual({ email: 'member@example.com' });
  expect(verifyOperatorAccess).toHaveBeenLastCalledWith(
    request,
    expect.objectContaining({ CF_ACCESS_POLICY_AUD: 'preview-audience' }),
  );
  for (const origin of ['https://staff.example.com', 'https://alternate.example.com', 'http://preview.example.com'])
    await expect(authenticatePreview(new Request(origin), bindings)).rejects.toThrow('hostname');
  expect(() =>
    previewOrigin({ ...bindings, CMS_PREVIEW_HOSTNAME: bindings.CMS_HOSTNAME }, new URL(request.url)),
  ).toThrow('not configured');
  vi.mocked(verifyOperatorAccess).mockResolvedValue({ status: 'unauthorized', reason: 'missing_token' });
  await expect(authenticatePreview(request, bindings)).rejects.toThrow('Sign in');
});

test('Local preview keeps an isolated hostname while retaining the selected Local port', () => {
  const bindings = { PRODUCT_ENVIRONMENT: 'LOCAL' } as AppBindings;
  expect(previewOrigin(bindings, new URL('http://127.0.0.1:8799/'))).toBe('http://localhost:8799');
  expect(isPreviewHost(new Request('http://127.0.0.1:8799/'), bindings)).toBe(false);
});
