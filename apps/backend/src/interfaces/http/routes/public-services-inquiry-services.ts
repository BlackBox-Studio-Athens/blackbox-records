import { EmailConfigurationError, sendServicesInquiry, type EmailOperationResult } from '../../../application/email';
import type { AppBindings } from '../../../platform/env';
import type { AppLogger } from '../../../platform/observability';
import { createEmailRuntimeServices } from '../../../infrastructure/resend';

export function createPublicServicesInquiryServices(bindings: AppBindings, logger: Pick<AppLogger, 'info' | 'warn'>) {
  return {
    errors: {
      EmailConfigurationError,
    },
    submitServicesInquiry: async (inquiry: unknown): Promise<EmailOperationResult> => {
      const emailRuntime = createEmailRuntimeServices(bindings);

      return sendServicesInquiry({
        config: emailRuntime.config,
        inquiry,
        logger,
        provider: emailRuntime.provider,
      });
    },
  };
}
