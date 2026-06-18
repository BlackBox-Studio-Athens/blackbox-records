import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingButtonContent } from '@/components/ui/loading-feedback';
import {
  createPublicCheckoutApi,
  PublicCheckoutApiError,
  type PublicCheckoutApi,
} from '@/lib/backend/public-checkout-api';

type NewsletterSignupFormProps = {
  api?: PublicCheckoutApi;
  buttonLabel: string;
  formId: string;
  note: string;
  placeholder: string;
};

type NewsletterSignupState =
  | {
      kind: 'idle';
    }
  | {
      kind: 'submitting';
    }
  | {
      kind: 'registered';
      message: string;
    }
  | {
      kind: 'error';
      message: string;
    };

export const NEWSLETTER_CONSENT_LABEL =
  'I agree to receive BlackBox Records release, distro, and event updates. I can unsubscribe anytime.';

export default function NewsletterSignupForm({
  api,
  buttonLabel,
  formId,
  note,
  placeholder,
}: NewsletterSignupFormProps) {
  const [email, setEmail] = React.useState('');
  const [consentAccepted, setConsentAccepted] = React.useState(false);
  const [state, setState] = React.useState<NewsletterSignupState>({ kind: 'idle' });
  const statusId = `${formId}-status`;
  const consentId = `${formId}-consent`;

  async function handleSubmit(event: Parameters<NonNullable<React.ComponentProps<'form'>['onSubmit']>>[0]) {
    event.preventDefault();

    if (!consentAccepted) {
      setState({
        kind: 'error',
        message: 'Confirm newsletter consent before subscribing.',
      });
      return;
    }

    setState({ kind: 'submitting' });

    try {
      await (api ?? createPublicCheckoutApi()).registerNewsletterSignup({
        consentAccepted: true,
        email,
      });
      setEmail('');
      setConsentAccepted(false);
      setState({
        kind: 'registered',
        message: 'Subscribed. Future BlackBox Records updates will go to that email.',
      });
    } catch (error) {
      setState({
        kind: 'error',
        message: readNewsletterSignupErrorMessage(error),
      });
    }
  }

  const isSubmitting = state.kind === 'submitting';

  return (
    <form className="mt-5 grid gap-3" aria-describedby={statusId} onSubmit={(event) => void handleSubmit(event)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="accessibility-visually-hidden-text" htmlFor={formId}>
          Email address
        </label>
        <Input
          id={formId}
          name="email"
          type="email"
          autoComplete="email"
          placeholder={placeholder}
          required
          value={email}
          className="h-11 rounded-none border-border/70 bg-background/85"
          disabled={isSubmitting}
          onChange={(event) => {
            setEmail(event.currentTarget.value);
          }}
        />
        <Button
          type="submit"
          className="h-11 rounded-none px-6 uppercase tracking-[0.12em]"
          disabled={isSubmitting}
          aria-busy={isSubmitting ? 'true' : undefined}
        >
          {isSubmitting ? <LoadingButtonContent label="Subscribing" /> : buttonLabel}
        </Button>
      </div>

      <label className="flex max-w-2xl items-start gap-3 text-xs leading-relaxed text-muted-foreground">
        <input
          id={consentId}
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 accent-foreground"
          checked={consentAccepted}
          disabled={isSubmitting}
          onChange={(event) => {
            setConsentAccepted(event.currentTarget.checked);
          }}
        />
        <span>{NEWSLETTER_CONSENT_LABEL}</span>
      </label>

      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{note}</p>

      <p
        id={statusId}
        role={state.kind === 'error' ? 'alert' : 'status'}
        aria-live="polite"
        className={state.kind === 'idle' ? 'accessibility-visually-hidden-text' : 'text-sm leading-relaxed'}
      >
        {state.kind === 'idle'
          ? 'Newsletter form ready.'
          : state.kind === 'submitting'
            ? 'Subscribing.'
            : state.message}
      </p>
    </form>
  );
}

export function readNewsletterSignupErrorMessage(error: unknown): string {
  if (error instanceof PublicCheckoutApiError && error.message.trim()) {
    return error.message;
  }

  return 'Newsletter signup is temporarily unavailable.';
}
