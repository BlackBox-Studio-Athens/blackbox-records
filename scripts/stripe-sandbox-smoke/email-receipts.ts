import { runFiniteCommand } from '../local-process';
import { redactSensitiveSmokeText, truncateForConsole } from '../smoke-core';
import { UAT_RESEND_RECEIVING_SINK_EMAIL } from '../../apps/backend/src/application/email/config';
import {
  createPaidOrderOpsSubject,
  createPaidOrderShopperSubject,
} from '../../apps/backend/src/application/email/paid-order-templates';

export const RESEND_RECEIPT_CLOCK_SKEW_LOOKBACK_MS = 5 * 60_000;
export const RESEND_RECEIPT_POLL_INTERVAL_MS = 2_000;
export const DEFAULT_RESEND_RECEIPT_TIMEOUT_MS = 120_000;

export type ResendReceivedEmail = {
  createdAt: string;
  subject: string;
  to: string[];
};

export type ResendEmailReceiptExpectation = {
  audience: 'ops' | 'shopper';
  orderReference: string;
  scenario: string;
  subject: string;
};

export type ResendEmailReceiptObservation = {
  audience: ResendEmailReceiptExpectation['audience'];
  issues: string[];
  matchCount: number;
  orderReference: string;
  receivedAt: string | null;
  scenario: string;
  status: 'failed' | 'passed';
};

export function createPaidOrderEmailReceiptExpectations(input: {
  orderReference: string;
  scenario: string;
}): ResendEmailReceiptExpectation[] {
  return [
    {
      audience: 'shopper',
      orderReference: input.orderReference,
      scenario: input.scenario,
      subject: createPaidOrderShopperSubject(input.orderReference),
    },
    {
      audience: 'ops',
      orderReference: input.orderReference,
      scenario: input.scenario,
      subject: createPaidOrderOpsSubject(input.orderReference),
    },
  ];
}

export function parseResendReceivingList(jsonText: string): ResendReceivedEmail[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Resend Receiving CLI returned malformed JSON.');
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.data)) {
    throw new Error('Resend Receiving CLI returned an invalid list response.');
  }

  return parsed.data.map((entry, index) => parseReceivedEmail(entry, index));
}

export async function runResendReceivingPreflight(
  runListCommand: () => Promise<string> = runResendReceivingListCommand,
): Promise<void> {
  try {
    parseResendReceivingList(await runListCommand());
  } catch (error) {
    const detail = redactSensitiveSmokeText(truncateForConsole(error instanceof Error ? error.message : String(error)));
    throw new Error(`Resend Receiving preflight failed: ${detail}`, { cause: error });
  }
}

export async function pollResendEmailReceipts(input: {
  expectations: readonly ResendEmailReceiptExpectation[];
  listReceivedEmails?: () => Promise<ResendReceivedEmail[]>;
  now?: () => number;
  runStartedAt: number;
  sinkEmail?: string;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs: number;
}): Promise<ResendEmailReceiptObservation[]> {
  const now = input.now ?? Date.now;
  const sleep = input.sleep ?? wait;
  const listReceivedEmails = input.listReceivedEmails ?? runResendReceivingList;
  const sinkEmail = normalizeAddress(input.sinkEmail ?? UAT_RESEND_RECEIVING_SINK_EMAIL);
  const deadline = input.runStartedAt + input.timeoutMs;
  let observations: ResendEmailReceiptObservation[];

  while (true) {
    try {
      observations = createReceiptObservations({
        emails: await listReceivedEmails(),
        expectations: input.expectations,
        runStartedAt: input.runStartedAt,
        sinkEmail,
      });
    } catch (error) {
      const detail = redactSensitiveSmokeText(
        truncateForConsole(error instanceof Error ? error.message : String(error)),
      );
      return input.expectations.map((expectation) => failedObservation(expectation, detail));
    }

    if (observations.every((observation) => observation.status === 'passed')) {
      return observations;
    }

    const remainingMs = deadline - now();
    if (remainingMs <= 0) {
      return observations;
    }

    await sleep(Math.min(RESEND_RECEIPT_POLL_INTERVAL_MS, remainingMs));
  }
}

export function createReceiptObservations(input: {
  emails: readonly ResendReceivedEmail[];
  expectations: readonly ResendEmailReceiptExpectation[];
  runStartedAt: number;
  sinkEmail: string;
}): ResendEmailReceiptObservation[] {
  const cutoff = input.runStartedAt - RESEND_RECEIPT_CLOCK_SKEW_LOOKBACK_MS;
  const sinkEmail = normalizeAddress(input.sinkEmail);

  return input.expectations.map((expectation) => {
    const matches = input.emails.filter(
      (email) =>
        email.subject === expectation.subject &&
        email.to.some((recipient) => normalizeAddress(recipient) === sinkEmail) &&
        Date.parse(email.createdAt) >= cutoff,
    );

    return {
      audience: expectation.audience,
      issues:
        matches.length === 1
          ? []
          : [
              matches.length === 0
                ? `Missing ${expectation.audience} receipt for ${expectation.scenario}.`
                : `Expected one ${expectation.audience} receipt for ${expectation.scenario}; found ${matches.length}.`,
            ],
      matchCount: matches.length,
      orderReference: expectation.orderReference,
      receivedAt: matches.length === 1 ? (matches[0]?.createdAt ?? null) : null,
      scenario: expectation.scenario,
      status: matches.length === 1 ? 'passed' : 'failed',
    };
  });
}

async function runResendReceivingList(): Promise<ResendReceivedEmail[]> {
  return parseResendReceivingList(await runResendReceivingListCommand());
}

async function runResendReceivingListCommand(): Promise<string> {
  const result = await runFiniteCommand(
    {
      args: ['emails', 'receiving', 'list', '--limit', '100', '--json'],
      command: 'resend',
      name: 'resend-receiving-list',
    },
    {
      logger: () => undefined,
      stdio: 'pipe',
    },
  );

  return typeof result.stdout === 'string' ? result.stdout : String(result.stdout ?? '');
}

function parseReceivedEmail(value: unknown, index: number): ResendReceivedEmail {
  if (!isRecord(value) || typeof value.subject !== 'string' || typeof value.created_at !== 'string') {
    throw new Error(`Resend Receiving CLI returned an invalid message at index ${index}.`);
  }

  const createdAt = Date.parse(value.created_at);
  if (!Number.isFinite(createdAt)) {
    throw new Error(`Resend Receiving CLI returned an invalid timestamp at index ${index}.`);
  }

  if (!Array.isArray(value.to) || value.to.some((recipient) => typeof recipient !== 'string')) {
    throw new Error(`Resend Receiving CLI returned an invalid recipient list at index ${index}.`);
  }

  return {
    createdAt: value.created_at,
    subject: value.subject,
    to: value.to,
  };
}

function failedObservation(expectation: ResendEmailReceiptExpectation, issue: string): ResendEmailReceiptObservation {
  return {
    audience: expectation.audience,
    issues: [issue],
    matchCount: 0,
    orderReference: expectation.orderReference,
    receivedAt: null,
    scenario: expectation.scenario,
    status: 'failed',
  };
}

function normalizeAddress(value: string): string {
  return value.trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
