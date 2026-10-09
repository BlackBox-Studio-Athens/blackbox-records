import type { OrderWithdrawalRepository, WithdrawalDeclaration } from '../../../domain/commerce/repositories/spi';
import {
  sendWithdrawalEmail,
  withdrawalReceiptText,
  type EmailProviderGateway,
  type EmailRuntimeConfig,
} from '../../email';
import { DELIVERY_RETRY_DELAY_MS, DELIVERY_WINDOW_MS } from './paid-order-delivery-processing';

export async function recordOrderWithdrawal(input: {
  declaration: WithdrawalDeclaration;
  id: string;
  requester: string;
  repository: OrderWithdrawalRepository;
  now?: Date;
}) {
  const declaration = {
    name: input.declaration.name.trim(),
    contract: input.declaration.contract.trim(),
    email: input.declaration.email.trim().toLowerCase(),
  };
  const result = await input.repository.record({
    ...declaration,
    id: input.id,
    fingerprint: await digest(JSON.stringify(declaration)),
    requesterHash: await digest(`${(input.now ?? new Date()).toISOString().slice(0, 10)}:${input.requester}`),
    submittedAt: (input.now ?? new Date()).toISOString(),
  });
  if (result.kind !== 'recorded') return result;
  return {
    kind: 'recorded' as const,
    receipt: {
      status: 'received' as const,
      receiptId: result.withdrawal.id,
      submittedAt: result.withdrawal.submittedAt,
      receiptText: withdrawalReceiptText(result.withdrawal),
    },
  };
}

export async function drainWithdrawalDeliveries(input: {
  repository: OrderWithdrawalRepository;
  config: EmailRuntimeConfig;
  provider: EmailProviderGateway;
  now: Date;
  limit: number;
  id?: string;
  logger: Pick<Console, 'info' | 'warn'>;
}): Promise<number> {
  let processed = 0;
  for (; processed < input.limit; processed += 1) {
    const delivery = await input.repository.claim(input.now, input.id);
    if (!delivery) break;
    let status: 'delivered' | 'pending' | 'needs_review' = 'needs_review';
    let safeReason: string | null = 'delivery_window_expired';
    let nextAttemptAt: string | null = null;
    if (input.now.getTime() - new Date(delivery.submittedAt).getTime() < DELIVERY_WINDOW_MS) {
      let sent = false;
      let retryable = true;
      safeReason = 'provider_outcome_unknown';
      try {
        const attempt = await sendWithdrawalEmail({
          config: input.config,
          provider: input.provider,
          notice: delivery,
          kind: delivery.kind,
        });
        sent = attempt.status === 'sent';
        retryable = attempt.retryable;
        safeReason = attempt.providerSafeReason ?? null;
      } catch {
        /* Retry the same provider key after unknown outcomes. */
      }
      status = sent ? 'delivered' : retryable && delivery.attemptCount < 5 ? 'pending' : 'needs_review';
      if (status === 'pending') nextAttemptAt = new Date(input.now.getTime() + DELIVERY_RETRY_DELAY_MS).toISOString();
    }
    const saved = await input.repository.finish(delivery, { status, safeReason, nextAttemptAt });
    const event = {
      event: 'withdrawal_delivery_outcome',
      kind: delivery.kind,
      status: saved ? status : 'lease_lost',
      safeReason,
    };
    if (status === 'delivered') input.logger.info(event);
    else input.logger.warn(event);
  }
  return processed;
}

async function digest(value: string): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}
