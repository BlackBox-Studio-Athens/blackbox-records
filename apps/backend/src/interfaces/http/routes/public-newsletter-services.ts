import { z } from 'zod';

import {
  EmailConfigurationError,
  NEWSLETTER_CONSENT_COPY_VERSION,
  logNewsletterRegistrationOutcome,
  registerNewsletterContact,
  type NewsletterRegistrationResult,
} from '../../../application/email';
import type { AppBindings } from '../../../env';
import type { AppLogger } from '../../../observability';
import { createEmailRuntimeServices } from './email-runtime-services';

const publicNewsletterEmail = z.string().trim().email();

export function createPublicNewsletterServices(bindings: AppBindings, logger: Pick<AppLogger, 'info' | 'warn'>) {
  return {
    errors: {
      EmailConfigurationError,
      ZodError: z.ZodError,
    },
    registerNewsletterSignup: async (input: {
      consentedAt?: Date;
      email: string;
    }): Promise<NewsletterRegistrationResult> => {
      const emailRuntime = createEmailRuntimeServices(bindings);
      const result = await registerNewsletterContact(emailRuntime.provider, emailRuntime.config, {
        consentCopyVersion: NEWSLETTER_CONSENT_COPY_VERSION,
        consentSource: 'site-form',
        consentedAt: input.consentedAt ?? new Date(),
        email: publicNewsletterEmail.parse(input.email),
      });

      logNewsletterRegistrationOutcome(logger, result, {
        source: 'site-form',
      });

      return result;
    },
  };
}
