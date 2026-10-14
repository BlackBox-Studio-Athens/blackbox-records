import { Resend } from 'resend';

import {
  createEmailConsentServices,
  readEmailRuntimeConfig,
  type EmailProviderGateway,
  type EmailRuntimeConfig,
} from '../../application/email';
import { D1EmailConsentRepository } from '../persistence/d1-email-consent-repository';
import type { AppBindings } from '../../platform/env';
import { ResendEmailGateway } from './resend-email-gateway';

export type EmailRuntimeServices = {
  config: EmailRuntimeConfig;
  provider: EmailProviderGateway;
  consent: ReturnType<typeof createEmailConsentServices>;
};

export function createEmailRuntimeServices(bindings: AppBindings): EmailRuntimeServices {
  const config = readEmailRuntimeConfig(bindings);
  const deliveryProvider = shouldUseLocalMockEmailProvider(config)
    ? createLocalMockEmailProviderGateway()
    : new ResendEmailGateway(new Resend(config.apiKey));
  const consent = createEmailConsentServices({
    config,
    provider: deliveryProvider,
    repository: new D1EmailConsentRepository(bindings.COMMERCE_DB),
  });
  return {
    config,
    consent,
    provider: {
      sendEmail: (message) => deliveryProvider.sendEmail(message),
      // Both site-form and checkout opt-ins enter the same mailbox verification path.
      registerNewsletterContact: (contact) => consent.requestNewsletter(contact),
    },
  };
}

function shouldUseLocalMockEmailProvider(config: EmailRuntimeConfig): boolean {
  return config.productEnvironmentProfile.productEnvironment === 'LOCAL' && config.apiKey.startsWith('re_mock_');
}

function createLocalMockEmailProviderGateway(): EmailProviderGateway {
  return {
    registerNewsletterContact: async () => ({ ok: true }),
    sendEmail: async () => ({ ok: true }),
  };
}
