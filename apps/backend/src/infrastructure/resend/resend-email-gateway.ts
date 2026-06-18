import { Resend, type ErrorResponse } from 'resend';

import {
  type EmailProviderGateway,
  type EmailProviderOperationResult,
  type EmailRuntimeConfig,
  type ProviderEmailMessage,
  type ProviderNewsletterContact,
} from '../../application/email';

type ResendClient = Pick<Resend, 'contacts' | 'emails'>;
type ResendResponse = {
  data: unknown;
  error: ErrorResponse | null;
};

export class ResendEmailGateway implements EmailProviderGateway {
  public constructor(private readonly resend: ResendClient) {}

  public async sendEmail(message: ProviderEmailMessage): Promise<EmailProviderOperationResult> {
    return mapResendResponse(
      await this.resend.emails.send(
        {
          from: message.from,
          html: message.html,
          replyTo: message.replyTo,
          subject: message.subject,
          tags: message.tags,
          text: message.text,
          to: message.to,
        },
        {
          idempotencyKey: message.idempotencyKey,
        },
      ),
    );
  }

  public async registerNewsletterContact(contact: ProviderNewsletterContact): Promise<EmailProviderOperationResult> {
    const updateResult = await this.resend.contacts.update({
      email: contact.email,
      properties: contact.properties,
      unsubscribed: false,
    });

    if (updateResult.error?.name === 'not_found') {
      const createResult = await this.resend.contacts.create({
        email: contact.email,
        properties: contact.properties,
        segments: contact.segmentId ? [{ id: contact.segmentId }] : undefined,
        topics: [
          {
            id: contact.topicId,
            subscription: 'opt_in',
          },
        ],
        unsubscribed: false,
      });

      return mapResendResponse(createResult);
    }

    const mappedUpdate = mapResendResponse(updateResult);
    if (!mappedUpdate.ok) {
      return mappedUpdate;
    }

    const topicResult = await this.resend.contacts.topics.update({
      email: contact.email,
      topics: [
        {
          id: contact.topicId,
          subscription: 'opt_in',
        },
      ],
    });
    const mappedTopic = mapResendResponse(topicResult);
    if (!mappedTopic.ok || !contact.segmentId) {
      return mappedTopic;
    }

    return mapResendResponse(
      await this.resend.contacts.segments.add({
        email: contact.email,
        segmentId: contact.segmentId,
      }),
    );
  }
}

export function createResendEmailGatewayFromConfig(config: EmailRuntimeConfig): EmailProviderGateway {
  return new ResendEmailGateway(new Resend(config.apiKey));
}

function mapResendResponse(response: ResendResponse): EmailProviderOperationResult {
  if (!response.error) {
    return {
      ok: true,
    };
  }

  return mapResendError(response.error);
}

function mapResendError(error: ErrorResponse): EmailProviderOperationResult {
  if (error.name === 'concurrent_idempotent_requests') {
    return {
      ok: false,
      reason: 'idempotency_conflict_retryable',
      retryable: true,
    };
  }

  if (error.name === 'invalid_idempotent_request' || error.name === 'invalid_idempotency_key') {
    return {
      ok: false,
      reason: 'idempotency_conflict_invalid',
      retryable: false,
    };
  }

  if (error.name === 'daily_quota_exceeded' || error.name === 'monthly_quota_exceeded') {
    return {
      ok: false,
      reason: 'quota_exceeded',
      retryable: false,
    };
  }

  if (error.name === 'rate_limit_exceeded') {
    return {
      ok: false,
      reason: 'rate_limited',
      retryable: true,
    };
  }

  if (
    error.name === 'validation_error' ||
    error.name === 'invalid_from_address' ||
    error.name === 'invalid_parameter'
  ) {
    return {
      ok: false,
      reason: 'validation',
      retryable: false,
    };
  }

  if (
    error.name === 'missing_api_key' ||
    error.name === 'restricted_api_key' ||
    error.name === 'invalid_api_key' ||
    error.name === 'invalid_access'
  ) {
    return {
      ok: false,
      reason: 'configuration',
      retryable: false,
    };
  }

  if (error.name === 'application_error' || error.name === 'internal_server_error') {
    return {
      ok: false,
      reason: 'provider_unavailable',
      retryable: true,
    };
  }

  return {
    ok: false,
    reason: 'unknown',
    retryable: false,
  };
}
