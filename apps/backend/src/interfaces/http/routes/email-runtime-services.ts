import { readEmailRuntimeConfig, type EmailProviderGateway, type EmailRuntimeConfig } from '../../../application/email';
import type { AppBindings } from '../../../env';
import { createResendEmailGatewayFromConfig } from '../../../infrastructure/resend';

export type EmailRuntimeServices = {
  config: EmailRuntimeConfig;
  provider: EmailProviderGateway;
};

export function createEmailRuntimeServices(bindings: AppBindings): EmailRuntimeServices {
  const config = readEmailRuntimeConfig(bindings);

  return {
    config,
    provider: shouldUseLocalMockEmailProvider(config)
      ? createLocalMockEmailProviderGateway()
      : createResendEmailGatewayFromConfig(config),
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
