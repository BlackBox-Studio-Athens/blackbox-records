import { describe, expect, it } from 'vitest';

import {
  buildResendUatSmokeEvidence,
  buildResendUatSmokeSummary,
  createResendUatSmokeEmail,
  parseResendUatSmokeArgs,
} from '../../../../scripts/smoke-resend-uat';
import { redactSensitiveSmokeText, scanHighRiskSmokeExposure } from '../../../../scripts/smoke-core';

describe('Resend UAT smoke runner', () => {
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

  it('builds smoke evidence and summaries with no provider secrets', () => {
    const evidence = buildResendUatSmokeEvidence({
      checks: [
        {
          bodyTextSnippet: '{"status":"registered"}',
          contentType: 'application/json',
          issues: [],
          kind: 'newsletter-registration',
          path: '/api/newsletter/registrations',
          status: 200,
          url: 'https://worker.example.test/api/newsletter/registrations',
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
