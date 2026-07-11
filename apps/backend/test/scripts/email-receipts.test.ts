import { describe, expect, it } from 'vitest';

import {
  createPaidOrderEmailReceiptExpectations,
  createReceiptObservations,
  parseResendReceivingList,
  pollResendEmailReceipts,
  RESEND_RECEIPT_CLOCK_SKEW_LOOKBACK_MS,
  runResendReceivingPreflight,
} from '../../../../scripts/stripe-sandbox-smoke/email-receipts';
import { UAT_RESEND_RECEIVING_SINK_EMAIL } from '../../src/application/email';

const runStartedAt = Date.parse('2026-07-11T10:00:00.000Z');
const expectations = createPaidOrderEmailReceiptExpectations({
  orderReference: 'BBR-2026-07-11-RAW-AMP-PACK',
  scenario: 'happy_path_paid',
});

describe('Stripe UAT email receipts', () => {
  it('preflights authenticated Receiving JSON without exposing CLI output', async () => {
    await expect(
      runResendReceivingPreflight(async () =>
        JSON.stringify({
          data: [],
          has_more: false,
          object: 'list',
        }),
      ),
    ).resolves.toBeUndefined();

    const preflightError = runResendReceivingPreflight(async () => {
      throw new Error('RESEND_API_KEY=re_live_secret');
    });
    await expect(preflightError).rejects.toThrow('Resend Receiving preflight failed');
    await expect(preflightError).rejects.not.toThrow('re_live_secret');
    expect(() => parseResendReceivingList('{"data":null}')).toThrow('invalid list response');
  });

  it('matches one shopper and one ops message at the managed sink', () => {
    const observations = createReceiptObservations({
      emails: expectations.map((expectation, index) => ({
        createdAt: new Date(runStartedAt + index).toISOString(),
        subject: expectation.subject,
        to: [UAT_RESEND_RECEIVING_SINK_EMAIL],
      })),
      expectations,
      runStartedAt,
      sinkEmail: UAT_RESEND_RECEIVING_SINK_EMAIL,
    });

    expect(observations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ audience: 'shopper', matchCount: 1, status: 'passed' }),
        expect.objectContaining({ audience: 'ops', matchCount: 1, status: 'passed' }),
      ]),
    );
  });

  it('rejects duplicate, stale, wrong-recipient, and wrong-subject messages', () => {
    const [shopper, ops] = expectations;
    const observations = createReceiptObservations({
      emails: [
        {
          createdAt: new Date(runStartedAt).toISOString(),
          subject: shopper!.subject,
          to: [UAT_RESEND_RECEIVING_SINK_EMAIL],
        },
        {
          createdAt: new Date(runStartedAt + 1).toISOString(),
          subject: shopper!.subject,
          to: [UAT_RESEND_RECEIVING_SINK_EMAIL],
        },
        {
          createdAt: new Date(runStartedAt - RESEND_RECEIPT_CLOCK_SKEW_LOOKBACK_MS - 1).toISOString(),
          subject: ops!.subject,
          to: [UAT_RESEND_RECEIVING_SINK_EMAIL],
        },
        {
          createdAt: new Date(runStartedAt).toISOString(),
          subject: ops!.subject,
          to: ['wrong@example.test'],
        },
        {
          createdAt: new Date(runStartedAt).toISOString(),
          subject: 'wrong subject',
          to: [UAT_RESEND_RECEIVING_SINK_EMAIL],
        },
      ],
      expectations,
      runStartedAt,
      sinkEmail: UAT_RESEND_RECEIVING_SINK_EMAIL,
    });

    expect(observations.map((observation) => observation.matchCount)).toEqual([2, 0]);
    expect(observations.every((observation) => observation.status === 'failed')).toBe(true);
  });

  it('stops at the bounded timeout when receipts never arrive', async () => {
    let now = runStartedAt;
    const observations = await pollResendEmailReceipts({
      expectations,
      listReceivedEmails: async () => [],
      now: () => now,
      runStartedAt,
      sleep: async (ms) => {
        now += ms;
      },
      timeoutMs: 2_000,
    });

    expect(observations).toHaveLength(2);
    expect(observations.every((observation) => observation.status === 'failed')).toBe(true);
    expect(observations.every((observation) => observation.matchCount === 0)).toBe(true);
  });
});
