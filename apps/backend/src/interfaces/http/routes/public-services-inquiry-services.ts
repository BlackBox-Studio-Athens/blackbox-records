import { EmailConfigurationError, sendServicesInquiry, type EmailOperationResult } from '../../../application/email';
import type { AppBindings } from '../../../env';
import type { AppLogger } from '../../../observability';
import { createEmailRuntimeServices } from './email-runtime-services';

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
