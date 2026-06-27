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

type NewsletterSignupErrorTarget = 'consent' | 'email' | 'form';

export type NewsletterSignupState =
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
      target: NewsletterSignupErrorTarget;
    };

export const NEWSLETTER_CONSENT_LABEL =
  'I agree to receive BlackBox Records release, distro, and event updates. I can unsubscribe anytime.';
export const NEWSLETTER_INVALID_EMAIL_MESSAGE = 'Enter a valid email address.';
export const NEWSLETTER_PROVIDER_UNAVAILABLE_MESSAGE = 'Newsletter signup is temporarily unavailable.';

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
  const errorId = `${formId}-error`;
  const consentId = `${formId}-consent`;
  const view = readNewsletterSignupView(state);

  async function handleSubmit(event: Parameters<NonNullable<React.ComponentProps<'form'>['onSubmit']>>[0]) {
    event.preventDefault();

    if (!consentAccepted) {
      setState({
        kind: 'error',
        message: 'Confirm newsletter consent before subscribing.',
        target: 'consent',
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
      setState(readNewsletterSignupErrorState(error));
    }
  }

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
          disabled={view.isSubmitting}
          aria-describedby={view.emailInvalid ? errorId : undefined}
          aria-invalid={view.emailInvalid ? 'true' : undefined}
          onChange={(event) => {
            setEmail(event.currentTarget.value);
            if (state.kind === 'error' && state.target === 'email') {
              setState({ kind: 'idle' });
            }
          }}
          onInvalid={(event) => {
            event.preventDefault();
            setState({
              kind: 'error',
              message: NEWSLETTER_INVALID_EMAIL_MESSAGE,
              target: 'email',
            });
          }}
        />
        <Button
          type="submit"
          className="h-11 rounded-none px-6 uppercase tracking-[0.12em]"
          disabled={view.isSubmitting}
          aria-busy={view.isSubmitting ? 'true' : undefined}
        >
          {view.isSubmitting ? <LoadingButtonContent label="Subscribing" /> : buttonLabel}
        </Button>
      </div>

      <label className="flex max-w-2xl items-start gap-3 text-xs leading-relaxed text-muted-foreground">
        <input
          id={consentId}
          type="checkbox"
          className="newsletter-signup-consent-checkbox mt-0.5 size-4 shrink-0 accent-foreground"
          checked={consentAccepted}
          disabled={view.isSubmitting}
          aria-describedby={view.consentInvalid ? errorId : undefined}
          aria-invalid={view.consentInvalid ? 'true' : undefined}
          onChange={(event) => {
            setConsentAccepted(event.currentTarget.checked);
            if (state.kind === 'error' && state.target === 'consent') {
              setState({ kind: 'idle' });
            }
          }}
        />
        <span>{NEWSLETTER_CONSENT_LABEL}</span>
      </label>

      <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{note}</p>

      <p id={statusId} role="status" aria-live="polite" aria-atomic="true" className={view.statusClassName}>
        {view.statusMessage}
      </p>

      <p
        id={errorId}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className={
          view.errorMessage
            ? 'text-sm leading-relaxed text-[color:var(--store-accent-active)]'
            : 'accessibility-visually-hidden-text'
        }
      >
        {view.errorMessage}
      </p>
    </form>
  );
}

export function readNewsletterSignupView(state: NewsletterSignupState) {
  return {
    consentInvalid: state.kind === 'error' && state.target === 'consent',
    emailInvalid: state.kind === 'error' && state.target === 'email',
    errorMessage: state.kind === 'error' ? state.message : '',
    isSubmitting: state.kind === 'submitting',
    statusClassName:
      state.kind === 'registered'
        ? 'text-sm leading-relaxed newsletter-signup-status--success'
        : state.kind === 'submitting'
          ? 'text-sm leading-relaxed'
          : 'accessibility-visually-hidden-text',
    statusMessage: state.kind === 'submitting' ? 'Subscribing.' : state.kind === 'registered' ? state.message : '',
    statusTone: state.kind === 'registered' ? 'success' : 'neutral',
  };
}

export function readNewsletterSignupErrorState(error: unknown): Extract<NewsletterSignupState, { kind: 'error' }> {
  return {
    kind: 'error',
    message: readNewsletterSignupErrorMessage(error),
    target: error instanceof PublicCheckoutApiError && error.status === 400 ? 'email' : 'form',
  };
}

export function readNewsletterSignupErrorMessage(error: unknown): string {
  if (error instanceof PublicCheckoutApiError && error.status === 400) {
    return NEWSLETTER_INVALID_EMAIL_MESSAGE;
  }

  return NEWSLETTER_PROVIDER_UNAVAILABLE_MESSAGE;
}
