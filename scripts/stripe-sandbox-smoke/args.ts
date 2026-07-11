import process from 'node:process';

import {
  normalizeBaseUrl,
  parseNamedSmokeScenarioSelection,
  parsePositiveInteger,
  parseScreenshotMode,
} from '../smoke-core';
import type {
  StripeSandboxScreenshotMode,
  StripeSandboxSmokeOptions,
  StripeSandboxSmokeScenarioName,
  StripeSandboxSmokeScenarioSelection,
} from '../smoke-stripe-sandbox';
import { defaultSiteUrl, defaultWorkerUrl } from './constants';
import { DEFAULT_RESEND_RECEIPT_TIMEOUT_MS } from './email-receipts';
import { allScenarioNames } from './scenario-policy';

export function parseStripeSandboxSmokeArgs(args: string[]): StripeSandboxSmokeOptions {
  const options: StripeSandboxSmokeOptions = {
    debug: false,
    declineConcurrency: 3,
    emailReceiptTimeoutMs: DEFAULT_RESEND_RECEIPT_TIMEOUT_MS,
    expectedCheckoutAmountMinor: null,
    expectedPaymentMethodLabels: parsePaymentMethodLabelList(process.env.STRIPE_SANDBOX_EXPECTED_PAYMENT_LABELS ?? ''),
    fieldActionTimeoutMs: 2_000,
    headed: false,
    scenarioSelection: 'all',
    screenshots: 'on-failure',
    siteUrl: defaultSiteUrl,
    timeoutMs: 120_000,
    trace: false,
    verifyEmailReceipts: false,
    workerUrl: defaultWorkerUrl,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--headed') {
      options.headed = true;
      continue;
    }

    if (arg === '--verify-email-receipts') {
      options.verifyEmailReceipts = true;
      continue;
    }

    if (arg === '--debug') {
      options.debug = true;
      options.headed = true;
      options.trace = true;
      continue;
    }

    if (arg === '--trace') {
      options.trace = true;
      continue;
    }

    if (arg === '--decline-concurrency') {
      const value = args[index + 1];
      index += 1;
      options.declineConcurrency = parsePositiveInteger(value, '--decline-concurrency');
      continue;
    }

    if (arg?.startsWith('--decline-concurrency=')) {
      options.declineConcurrency = parsePositiveInteger(
        arg.slice('--decline-concurrency='.length),
        '--decline-concurrency',
      );
      continue;
    }

    if (arg === '--field-action-timeout-ms') {
      const value = args[index + 1];
      index += 1;
      options.fieldActionTimeoutMs = parsePositiveInteger(value, '--field-action-timeout-ms');
      continue;
    }

    if (arg === '--expected-payment-label') {
      const value = args[index + 1];
      index += 1;
      options.expectedPaymentMethodLabels.push(parsePaymentMethodLabel(value, '--expected-payment-label'));
      continue;
    }

    if (arg === '--expected-checkout-amount-minor') {
      const value = args[index + 1];
      index += 1;
      options.expectedCheckoutAmountMinor = parsePositiveInteger(value, '--expected-checkout-amount-minor');
      continue;
    }

    if (arg?.startsWith('--expected-checkout-amount-minor=')) {
      options.expectedCheckoutAmountMinor = parsePositiveInteger(
        arg.slice('--expected-checkout-amount-minor='.length),
        '--expected-checkout-amount-minor',
      );
      continue;
    }

    if (arg?.startsWith('--expected-payment-label=')) {
      options.expectedPaymentMethodLabels.push(
        parsePaymentMethodLabel(arg.slice('--expected-payment-label='.length), '--expected-payment-label'),
      );
      continue;
    }

    if (arg === '--expected-payment-labels') {
      const value = args[index + 1];
      index += 1;
      options.expectedPaymentMethodLabels = parsePaymentMethodLabelList(value, '--expected-payment-labels');
      continue;
    }

    if (arg?.startsWith('--expected-payment-labels=')) {
      options.expectedPaymentMethodLabels = parsePaymentMethodLabelList(
        arg.slice('--expected-payment-labels='.length),
        '--expected-payment-labels',
      );
      continue;
    }

    if (arg?.startsWith('--field-action-timeout-ms=')) {
      options.fieldActionTimeoutMs = parsePositiveInteger(
        arg.slice('--field-action-timeout-ms='.length),
        '--field-action-timeout-ms',
      );
      continue;
    }

    if (arg === '--screenshots') {
      const value = args[index + 1];
      index += 1;
      options.screenshots = parseStripeSandboxScreenshotMode(value);
      continue;
    }

    if (arg?.startsWith('--screenshots=')) {
      options.screenshots = parseStripeSandboxScreenshotMode(arg.slice('--screenshots='.length));
      continue;
    }

    if (arg === '--use-running-stack' || arg === '--manual-timeout-ms') {
      if (arg === '--manual-timeout-ms') {
        index += 1;
      }

      console.warn(`${arg} is ignored; smoke:stripe-uat now targets deployed UAT only.`);
      continue;
    }

    if (arg?.startsWith('--manual-timeout-ms=')) {
      console.warn('--manual-timeout-ms is ignored; use --timeout-ms for browser automation timeouts.');
      continue;
    }

    if (arg === '--timeout-ms') {
      const value = args[index + 1];
      index += 1;
      options.timeoutMs = parsePositiveInteger(value, '--timeout-ms');
      continue;
    }

    if (arg === '--email-receipt-timeout-ms') {
      const value = args[index + 1];
      index += 1;
      options.emailReceiptTimeoutMs = parsePositiveInteger(value, '--email-receipt-timeout-ms');
      continue;
    }

    if (arg?.startsWith('--email-receipt-timeout-ms=')) {
      options.emailReceiptTimeoutMs = parsePositiveInteger(
        arg.slice('--email-receipt-timeout-ms='.length),
        '--email-receipt-timeout-ms',
      );
      continue;
    }

    if (arg?.startsWith('--timeout-ms=')) {
      options.timeoutMs = parsePositiveInteger(arg.slice('--timeout-ms='.length), '--timeout-ms');
      continue;
    }

    if (arg === '--scenario') {
      const value = args[index + 1];
      index += 1;
      options.scenarioSelection = parseScenarioSelection(value);
      continue;
    }

    if (arg?.startsWith('--scenario=')) {
      options.scenarioSelection = parseScenarioSelection(arg.slice('--scenario='.length));
      continue;
    }

    if (arg === '--site-url') {
      const value = args[index + 1];
      index += 1;
      options.siteUrl = normalizeBaseUrl(value, '--site-url');
      continue;
    }

    if (arg?.startsWith('--site-url=')) {
      options.siteUrl = normalizeBaseUrl(arg.slice('--site-url='.length), '--site-url');
      continue;
    }

    if (arg === '--worker-url') {
      const value = args[index + 1];
      index += 1;
      options.workerUrl = normalizeBaseUrl(value, '--worker-url');
      continue;
    }

    if (arg?.startsWith('--worker-url=')) {
      options.workerUrl = normalizeBaseUrl(arg.slice('--worker-url='.length), '--worker-url');
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function parseScenarioSelection(value: string | undefined): StripeSandboxSmokeScenarioSelection {
  if (value?.includes(',')) {
    const selected = value
      .split(',')
      .map((item) => parseNamedSmokeScenarioSelection(item.trim(), allScenarioNames, 'Stripe sandbox smoke'));

    if (selected.includes('all')) {
      throw new Error('Stripe sandbox smoke scenario lists cannot include all.');
    }

    return [...new Set(selected.filter((item): item is StripeSandboxSmokeScenarioName => item !== 'all'))];
  }

  return parseNamedSmokeScenarioSelection(value, allScenarioNames, 'Stripe sandbox smoke');
}

function parseStripeSandboxScreenshotMode(value: string | undefined): StripeSandboxScreenshotMode {
  return parseScreenshotMode(value);
}

function parsePaymentMethodLabel(value: string | undefined, flag: string): string {
  const label = normalizePaymentMethodLabel(value ?? '');

  if (!label) {
    throw new Error(`${flag} must include a payment method label.`);
  }

  return label;
}

function normalizePaymentMethodLabel(label: string): string {
  return label.trim().replace(/\s+/g, ' ');
}

function parsePaymentMethodLabelList(
  value: string | undefined,
  flag = 'STRIPE_SANDBOX_EXPECTED_PAYMENT_LABELS',
): string[] {
  return uniqueStrings(
    (value ?? '')
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean)
      .map((label) => parsePaymentMethodLabel(label, flag)),
  );
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}
