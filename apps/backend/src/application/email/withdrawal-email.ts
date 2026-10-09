import { createBlackBoxEmailTemplate } from './templates';
import { sendTransactionalEmail } from './transactional-email';
import type { EmailProviderGateway } from './spi';
import type { EmailRuntimeConfig } from './types';

type WithdrawalEmailInput = { id: string; name: string; contract: string; email: string; submittedAt: string };
export const WITHDRAWAL_SUPPORT_EMAIL = 'orders@blackboxrecordsathens.com';

export function withdrawalReceiptText(notice: WithdrawalEmailInput): string {
  return [
    'BlackBox Records — withdrawal received',
    `Receipt: ${notice.id}`,
    `Submitted at (UTC): ${notice.submittedAt}`,
    '',
    'Declaration: I hereby withdraw from the contract identified below.',
    `Name: ${notice.name}`,
    `Contract / goods: ${notice.contract}`,
    `Acknowledgement email: ${notice.email}`,
    '',
    'This acknowledges receipt of your declaration. It does not confirm refund approval or payment.',
    `Contact: ${WITHDRAWAL_SUPPORT_EMAIL}`,
  ].join('\n');
}

export async function sendWithdrawalEmail(input: {
  config: EmailRuntimeConfig;
  provider: EmailProviderGateway;
  notice: WithdrawalEmailInput;
  kind: 'acknowledgement' | 'support';
}) {
  const text = withdrawalReceiptText(input.notice);
  // Visitor fields are plain text only, never headers, HTML, hyperlinks or recipient overrides.
  const escaped = text.replace(
    /[&<>"']/g,
    (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );
  return sendTransactionalEmail(input.provider, input.config, {
    content: createBlackBoxEmailTemplate({
      subject:
        input.kind === 'support'
          ? 'Withdrawal declaration received — BlackBox Records'
          : 'Your withdrawal declaration — BlackBox Records',
      preheader: 'Your declaration and submission time.',
      bodyText: text,
      bodyHtml: `<main style="max-width:620px;margin:32px auto;padding:24px;border:1px solid #454545"><h1>Withdrawal received</h1><pre style="white-space:pre-wrap;overflow-wrap:anywhere;font:14px/1.7 Helvetica,Arial,sans-serif">${escaped}</pre></main>`,
    }),
    idempotencyEntityId: input.notice.id,
    purpose: `withdrawal-${input.kind}`,
    replyTo: input.kind === 'support' ? input.notice.email : WITHDRAWAL_SUPPORT_EMAIL,
    to: input.kind === 'support' ? WITHDRAWAL_SUPPORT_EMAIL : input.notice.email,
  });
}
