import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildResendUatSmokeEvidence,
  buildResendUatSmokeSummary,
  checkServicesInquirySubmission,
  createResendUatSmokeEmail,
  createResendUatSmokeServicesInquiry,
  parseResendUatSmokeArgs,
} from '../../../../scripts/smoke-resend-uat';
import { redactSensitiveSmokeText, scanHighRiskSmokeExposure } from '../../../../scripts/smoke-core';

describe('Resend UAT smoke runner', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('defaults to the deployed UAT Worker and parses overrides', () => {
    expect(parseResendUatSmokeArgs([])).toMatchObject({
      evidenceDir: expect.stringContaining('resend-uat'),
      timeoutMs: 30_000,
      workerUrl: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev',
    });

    expect(
      parseResendUatSmokeArgs([
        '--worker-url',
        'https://worker.example.test/',
        '--timeout-ms=45000',
        '--evidence-dir',
        '.codex-artifacts/smoke/uat/resend-uat',
      ]),
    ).toEqual({
      evidenceDir: '.codex-artifacts/smoke/uat/resend-uat',
      timeoutMs: 45_000,
      workerUrl: 'https://worker.example.test',
    });
  });

  it('uses a synthetic email identity for UAT contact routing', () => {
    expect(createResendUatSmokeEmail('20260618010102')).toBe('uat-resend-smoke+20260618010102@blackbox.example');
  });

  it('submits a deterministic Services inquiry without persisting visitor content in evidence', async () => {
    const inquiry = createResendUatSmokeServicesInquiry('20260618010102');
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ ...inquiry, status: 'submitted' }), {
          headers: {
            'cache-control': 'no-store',
            'content-type': 'application/json',
          },
          status: 200,
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const check = await checkServicesInquirySubmission(
      {
        evidenceDir: '.codex-artifacts/smoke/uat/resend-uat',
        timeoutMs: 30_000,
        workerUrl: 'https://worker.example.test',
      },
      inquiry,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://worker.example.test/api/services/inquiries',
      expect.objectContaining({
        body: JSON.stringify(inquiry),
        headers: {
          'content-type': 'application/json',
          origin: 'https://blackbox-studio-athens.github.io',
        },
        method: 'POST',
      }),
    );
    expect(check).toMatchObject({
      bodyTextSnippet: '{"status":"submitted"}',
      issues: [],
      kind: 'services-inquiry-submission',
      path: '/api/services/inquiries',
      recipientPolicy: 'managed-uat-sink',
      status: 200,
    });

    const serializedCheck = JSON.stringify(check);
    for (const value of Object.values(inquiry)) expect(serializedCheck).not.toContain(value);
  });

  it('builds smoke evidence and summaries with no provider secrets', () => {
    const evidence = buildResendUatSmokeEvidence({
      checks: [
        {
          bodyTextSnippet: '{"status":"registered"}',
          contentType: 'application/json',
          issues: [],
          kind: 'newsletter-registration',
          path: '/api/newsletter/registrations',
          recipientPolicy: null,
          status: 200,
          url: 'https://worker.example.test/api/newsletter/registrations',
        },
        {
          bodyTextSnippet: '{"status":"submitted"}',
          contentType: 'application/json',
          issues: [],
          kind: 'services-inquiry-submission',
          path: '/api/services/inquiries',
          recipientPolicy: 'managed-uat-sink',
          status: 200,
          url: 'https://worker.example.test/api/services/inquiries',
        },
      ],
      runId: '20260618010102',
      status: 'passed',
      workerUrl: 'https://worker.example.test',
    });

    expect(evidence).toMatchObject({
      environment: 'uat',
      runId: '20260618010102',
      status: 'passed',
      suite: 'resend-uat',
      workerUrl: 'https://worker.example.test',
    });
    expect(evidence.summary).toContain('Resend UAT smoke: PASSED (0 issue(s))');
    expect(evidence.summary).toContain('- checks: 2');
    expect(buildResendUatSmokeSummary(evidence)).toMatchObject({
      environment: 'uat',
      runId: '20260618010102',
      status: 'passed',
      suite: 'resend-uat',
    });
  });

  it('redacts Resend runtime secrets from smoke text', () => {
    const text = 'RESEND_API_KEY=re_should_not_print\nRESEND_NEWSLETTER_TOPIC_ID=topic_123';

    expect(redactSensitiveSmokeText(text)).toContain('RESEND_API_KEY=[redacted_resend_api_key]');
    expect(scanHighRiskSmokeExposure(text)).toEqual([
      'runtime secret name RESEND_API_KEY',
      'runtime config name RESEND_NEWSLETTER_TOPIC_ID',
      'Resend API key value',
    ]);
  });
});
