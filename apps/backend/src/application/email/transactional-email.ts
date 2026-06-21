import { z } from 'zod';

import { createEmailIdempotencyKey, createProviderSafeTag } from './idempotency';
import { routeTransactionalEmailRecipient } from './routing';
import type { EmailProviderGateway } from './spi';
import type { EmailOperationResult, EmailRuntimeConfig, TransactionalEmailCommand } from './types';

const emailAddress = z.string().trim().email();

export async function sendTransactionalEmail(
  provider: EmailProviderGateway,
  config: EmailRuntimeConfig,
  command: TransactionalEmailCommand,
): Promise<EmailOperationResult> {
  const intendedRecipient = emailAddress.parse(command.to);
  const routedRecipient = routeTransactionalEmailRecipient(config, intendedRecipient);
  const idempotencyKey = createEmailIdempotencyKey({
    config,
    entityId: command.idempotencyEntityId,
    purpose: command.purpose,
  });
  const providerResult = await provider.sendEmail({
    from: config.fromEmail,
    html: command.content.html,
    idempotencyKey,
    replyTo: config.replyToEmail,
    subject: command.content.subject,
    tags: [
      createProviderSafeTag({ name: 'purpose', value: command.purpose }),
      createProviderSafeTag({
        name: 'environment',
        value: config.productEnvironmentProfile.emailProviderTag,
      }),
      createProviderSafeTag({ name: 'sink_routed', value: routedRecipient.isSinkRouted ? 'true' : 'false' }),
      ...(command.tags ?? []).map(createProviderSafeTag),
    ],
    text: command.content.text,
    to: routedRecipient.to,
  });

  if (!providerResult.ok) {
    return {
      idempotencyKey,
      providerSafeReason: providerResult.reason,
      retryable: providerResult.retryable,
      routedRecipient,
      status: 'failed',
    };
  }

  return {
    idempotencyKey,
    retryable: false,
    routedRecipient,
    status: 'sent',
  };
}
