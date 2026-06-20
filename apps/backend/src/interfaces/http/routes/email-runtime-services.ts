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
    provider: createResendEmailGatewayFromConfig(config),
  };
}
