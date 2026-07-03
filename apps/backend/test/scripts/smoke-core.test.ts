import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  createRouteUrl,
  createRunId,
  createSmokeEvidencePath,
  createSmokeRunArtifactDir,
  createSmokeScenarioArtifactDir,
  createSmokeSummaryPath,
  normalizeBaseUrl,
  parseNamedSmokeScenarioSelection,
  parsePositiveInteger,
  parseRequiredValue,
  parseScreenshotMode,
  redactSensitiveSmokeText,
  resolveSmokeScenarioSelection,
  scanHighRiskSmokeExposure,
} from '../../../../scripts/smoke-core';

describe('smoke core helpers', () => {
  it('builds normalized smoke routes and artifact paths', () => {
    expect(createRouteUrl('https://blackbox.example/blackbox-records/', '/store/checkout/')).toBe(
      'https://blackbox.example/blackbox-records/store/checkout/',
    );
    expect(createRunId(new Date('2026-05-17T00:01:02.345Z'))).toBe('20260517000102');
    expect(createSmokeRunArtifactDir('C:\\repo', 'uat', 'stripe-sandbox', '20260517000102')).toBe(
      path.join('C:\\repo', '.codex-artifacts', 'smoke', 'uat', 'stripe-sandbox', '20260517000102'),
    );
    expect(createSmokeScenarioArtifactDir(path.join('run', 'scenario'), 'cms_admin')).toBe(
      path.join('run', 'scenario', 'cms_admin'),
    );
    expect(createSmokeEvidencePath(path.join('run', 'scenario'))).toBe(path.join('run', 'scenario', 'evidence.json'));
    expect(createSmokeSummaryPath(path.join('run'))).toBe(path.join('run', 'summary.json'));
    expect(normalizeBaseUrl('https://blackbox.example/blackbox-records/?preview=true#top', '--site-url')).toBe(
      'https://blackbox.example/blackbox-records',
    );
  });

  it('parses smoke selections and numeric options', () => {
    expect(parseNamedSmokeScenarioSelection('all', ['cms_admin', 'cms_assets'], 'UAT static smoke')).toBe('all');
    expect(parseNamedSmokeScenarioSelection('cms_assets', ['cms_admin', 'cms_assets'], 'UAT static smoke')).toBe(
      'cms_assets',
    );
    expect(resolveSmokeScenarioSelection('cms_assets', [{ name: 'cms_admin' }, { name: 'cms_assets' }])).toEqual([
      { name: 'cms_assets' },
    ]);
    expect(parsePositiveInteger('45000', '--timeout-ms')).toBe(45_000);
    expect(parseRequiredValue('--site-url', ' https://blackbox.example/blackbox-records ')).toBe(
      'https://blackbox.example/blackbox-records',
    );
    expect(parseScreenshotMode('on-failure')).toBe('on-failure');
  });

  it('flags and redacts high-risk smoke secrets', () => {
    const text = [
      'STRIPE_SECRET_KEY=sk_test_1234567890',
      'STRIPE_WEBHOOK_SECRET=whsec_abcdef',
      'COMMERCE_DB=prod-db',
      'CF-ACCESS-AUTHENTICATED-USER-EMAIL=tester@example.test',
      'checkout_session=cs_live_abcdef',
      'checkout session cs_live_abcdef_secret_123456',
    ].join('\n');

    expect(scanHighRiskSmokeExposure(text)).toEqual(
      expect.arrayContaining([
        'runtime secret name STRIPE_SECRET_KEY',
        'runtime secret name STRIPE_WEBHOOK_SECRET',
        'D1 binding name COMMERCE_DB',
        'operator identity header CF-ACCESS-AUTHENTICATED-USER-EMAIL',
      ]),
    );
    expect(redactSensitiveSmokeText(text)).not.toContain('sk_test_1234567890');
    expect(redactSensitiveSmokeText(text)).not.toContain('whsec_abcdef');
    expect(redactSensitiveSmokeText(text)).toContain('[redacted_stripe_secret_key]');
    expect(redactSensitiveSmokeText(text)).toContain('[redacted_stripe_webhook_secret]');
    expect(redactSensitiveSmokeText(text)).toContain('[redacted_checkout_session_id]');
    expect(redactSensitiveSmokeText(text)).toContain('cs_live_abcdef_secret_[redacted]');
  });
});
