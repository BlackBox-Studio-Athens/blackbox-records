import { describe, expect, it, vi } from 'vitest';

import { ResendEmailGateway } from '../../../src/infrastructure/resend';

function success(data: unknown = { id: 'provider_id' }) {
  return {
    data,
    error: null,
    headers: null,
  };
}

function failure(name: string, statusCode = 400) {
  return {
    data: null,
    error: {
      message: 'Raw provider diagnostic that must not escape.',
      name,
      statusCode,
    },
    headers: null,
  };
}

describe('ResendEmailGateway', () => {
  it('maps email send payloads to the SDK with idempotency options', async () => {
    const send = vi.fn(async () => success());
    const gateway = new ResendEmailGateway({
      contacts: {
        create: vi.fn(),
        segments: { add: vi.fn() },
        topics: { update: vi.fn() },
        update: vi.fn(),
      },
      emails: { send },
    } as never);

    await expect(
      gateway.sendEmail({
        from: 'orders@blackboxrecordsathens.com',
        html: '<p>Paid</p>',
        idempotencyKey: 'blackbox:uat:paid-order-shopper:cs_test_123',
        replyTo: 'support@blackboxrecordsathens.com',
        subject: 'Order paid',
        tags: [{ name: 'purpose', value: 'paid-order-shopper' }],
        text: 'Paid',
        to: 'uat-sink@ambkime.resend.app',
      }),
    ).resolves.toEqual({ ok: true });

    expect(send).toHaveBeenCalledWith(
      {
        from: 'orders@blackboxrecordsathens.com',
        html: '<p>Paid</p>',
        replyTo: 'support@blackboxrecordsathens.com',
        subject: 'Order paid',
        tags: [{ name: 'purpose', value: 'paid-order-shopper' }],
        text: 'Paid',
        to: 'uat-sink@ambkime.resend.app',
      },
      {
        idempotencyKey: 'blackbox:uat:paid-order-shopper:cs_test_123',
      },
    );
  });

  it('updates existing newsletter Contacts, opts into Topic, and adds optional Segment', async () => {
    const update = vi.fn(async () => success({ id: 'contact_id' }));
    const updateTopics = vi.fn(async () => success({ id: 'topic_id' }));
    const addSegment = vi.fn(async () => success({ id: 'segment_id' }));
    const gateway = new ResendEmailGateway({
      contacts: {
        create: vi.fn(),
        segments: { add: addSegment },
        topics: { update: updateTopics },
        update,
      },
      emails: { send: vi.fn() },
    } as never);

    await expect(
      gateway.registerNewsletterContact({
        email: 'uat-sink@ambkime.resend.app',
        properties: {
          consentSource: 'site-form',
        },
        segmentId: 'seg_newsletter',
        topicId: 'topic_newsletter',
      }),
    ).resolves.toEqual({ ok: true });

    expect(update).toHaveBeenCalledWith({
      email: 'uat-sink@ambkime.resend.app',
      properties: {
        consentSource: 'site-form',
      },
      unsubscribed: false,
    });
    expect(updateTopics).toHaveBeenCalledWith({
      email: 'uat-sink@ambkime.resend.app',
      topics: [{ id: 'topic_newsletter', subscription: 'opt_in' }],
    });
    expect(addSegment).toHaveBeenCalledWith({
      email: 'uat-sink@ambkime.resend.app',
      segmentId: 'seg_newsletter',
    });
  });

  it('creates a newsletter Contact with explicit Topic opt-in when update reports not found', async () => {
    const create = vi.fn(async () => success({ id: 'contact_id' }));
    const gateway = new ResendEmailGateway({
      contacts: {
        create,
        segments: { add: vi.fn() },
        topics: { update: vi.fn() },
        update: vi.fn(async () => failure('not_found', 404)),
      },
      emails: { send: vi.fn() },
    } as never);

    await expect(
      gateway.registerNewsletterContact({
        email: 'subscriber@example.com',
        properties: {
          consentSource: 'site-form',
        },
        segmentId: null,
        topicId: 'topic_newsletter',
      }),
    ).resolves.toEqual({ ok: true });

    expect(create).toHaveBeenCalledWith({
      email: 'subscriber@example.com',
      properties: {
        consentSource: 'site-form',
      },
      segments: undefined,
      topics: [{ id: 'topic_newsletter', subscription: 'opt_in' }],
      unsubscribed: false,
    });
  });

  it('maps provider errors to safe reasons without leaking raw diagnostics', async () => {
    const gateway = new ResendEmailGateway({
      contacts: {
        create: vi.fn(),
        segments: { add: vi.fn() },
        topics: { update: vi.fn() },
        update: vi.fn(),
      },
      emails: {
        send: vi.fn(async () => failure('concurrent_idempotent_requests', 409)),
      },
    } as never);

    await expect(
      gateway.sendEmail({
        from: 'orders@blackboxrecordsathens.com',
        html: '<p>Paid</p>',
        idempotencyKey: 'blackbox:uat:paid-order-shopper:cs_test_123',
        replyTo: 'support@blackboxrecordsathens.com',
        subject: 'Order paid',
        tags: [],
        text: 'Paid',
        to: 'uat-sink@ambkime.resend.app',
      }),
    ).resolves.toEqual({
      ok: false,
      reason: 'idempotency_conflict_retryable',
      retryable: true,
    });
  });

  it('maps invalid idempotent requests as non-retryable config warnings', async () => {
    const gateway = new ResendEmailGateway({
      contacts: {
        create: vi.fn(),
        segments: { add: vi.fn() },
        topics: { update: vi.fn() },
        update: vi.fn(),
      },
      emails: {
        send: vi.fn(async () => failure('invalid_idempotent_request', 409)),
      },
    } as never);

    await expect(
      gateway.sendEmail({
        from: 'orders@blackboxrecordsathens.com',
        html: '<p>Paid</p>',
        idempotencyKey: 'blackbox:uat:paid-order-shopper:cs_test_123',
        replyTo: 'support@blackboxrecordsathens.com',
        subject: 'Order paid',
        tags: [],
        text: 'Paid',
        to: 'uat-sink@ambkime.resend.app',
      }),
    ).resolves.toEqual({
      ok: false,
      reason: 'idempotency_conflict_invalid',
      retryable: false,
    });
  });
});
