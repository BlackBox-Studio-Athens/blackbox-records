import * as React from 'react';
import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PublicCheckoutApi } from './public-checkout-api';

export const AVAILABILITY_ALERT_COPY = {
  open: 'Email me when it lands',
  email: 'Email',
  emailPlaceholder: 'you@example.com',
  consent: 'Email me once when this can be bought or pre-ordered.',
  send: 'Send',
  sending: 'Sending',
  cancel: 'Cancel',
  invalidEmail: 'Enter a valid email.',
  missingConsent: 'Tick the box so we can email you.',
  failed: "Couldn't save that. Try again.",
  done: "We'll email you once when it can be ordered.",
} as const;

export type AvailabilityAlertStep = 'closed' | 'open' | 'sending' | 'done';
export type AvailabilityAlertErrors = { email?: string; consent?: string; form?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Client checks run before any request; the Worker validates the same payload again.
export function availabilityAlertErrors(email: string, consent: boolean): AvailabilityAlertErrors {
  return {
    ...(EMAIL_PATTERN.test(email.trim()) ? {} : { email: AVAILABILITY_ALERT_COPY.invalidEmail }),
    ...(consent ? {} : { consent: AVAILABILITY_ALERT_COPY.missingConsent }),
  };
}

// Sends only the email, the consent and the Store Item; any failure (400, 404, 503) reads as retryable.
export async function sendAvailabilityAlert(
  api: PublicCheckoutApi | undefined,
  storeItemSlug: string,
  email: string,
): Promise<'done' | AvailabilityAlertErrors> {
  try {
    const client = api ?? (await import('./public-checkout-api')).createPublicCheckoutApi();
    await client.requestAvailabilityAlert(storeItemSlug, { email: email.trim(), consent: true });
    return 'done';
  } catch {
    return { form: AVAILABILITY_ALERT_COPY.failed };
  }
}

// Notify me: a quiet action that opens an in-place form; the Worker decides eligibility again on submit.
export default function AvailabilityAlertForm({
  api,
  initial,
  storeItemSlug,
}: {
  api?: PublicCheckoutApi | undefined;
  /** Starting state; the page always starts closed. */
  initial?: { step: AvailabilityAlertStep; email?: string; consent?: boolean; errors?: AvailabilityAlertErrors };
  storeItemSlug: string;
}) {
  const id = React.useId();
  const [step, setStep] = React.useState<AvailabilityAlertStep>(initial?.step ?? 'closed');
  const [email, setEmail] = React.useState(initial?.email ?? '');
  const [consent, setConsent] = React.useState(initial?.consent ?? false);
  const [errors, setErrors] = React.useState<AvailabilityAlertErrors>(initial?.errors ?? {});
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const doneRef = React.useRef<HTMLParagraphElement>(null);
  const returnFocus = React.useRef(false);

  React.useEffect(() => {
    if (step === 'open' && !returnFocus.current) emailRef.current?.focus();
    if (step === 'done') doneRef.current?.focus();
    if (step === 'closed' && returnFocus.current) {
      returnFocus.current = false;
      triggerRef.current?.focus();
    }
  }, [step]);

  function close() {
    returnFocus.current = true;
    setErrors({});
    setStep('closed');
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 'sending') return;
    const nextErrors = availabilityAlertErrors(email, consent);
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.consent) {
      if (nextErrors.email) emailRef.current?.focus();
      return;
    }
    setStep('sending');
    const result = await sendAvailabilityAlert(api, storeItemSlug, email);
    if (result === 'done') {
      setStep('done');
    } else {
      setErrors(result);
      setStep('open');
    }
  }

  if (step === 'closed') {
    return (
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="lg"
        className="availability-alert__open"
        data-availability-alert-open
        onClick={() => setStep('open')}
      >
        <Mail aria-hidden="true" strokeWidth={1.75} />
        {AVAILABILITY_ALERT_COPY.open}
      </Button>
    );
  }

  if (step === 'done') {
    return (
      <p ref={doneRef} className="availability-alert__done" role="status" tabIndex={-1} data-availability-alert-done>
        <span aria-hidden="true">✓</span> {AVAILABILITY_ALERT_COPY.done}
      </p>
    );
  }

  const sending = step === 'sending';
  const emailErrorId = `${id}-email-error`;
  const consentErrorId = `${id}-consent-error`;

  return (
    <form
      className="availability-alert"
      noValidate
      aria-label="Notify me"
      data-availability-alert-form
      onSubmit={(event) => void submit(event)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !sending) {
          event.preventDefault();
          close();
        }
      }}
    >
      <label className="availability-alert__label" htmlFor={`${id}-email`}>
        {AVAILABILITY_ALERT_COPY.email}
      </label>
      <input
        ref={emailRef}
        id={`${id}-email`}
        className="availability-alert__input"
        type="email"
        name="email"
        autoComplete="email"
        placeholder={AVAILABILITY_ALERT_COPY.emailPlaceholder}
        value={email}
        disabled={sending}
        aria-invalid={errors.email ? 'true' : undefined}
        aria-describedby={errors.email ? emailErrorId : undefined}
        onChange={(event) => {
          setEmail(event.currentTarget.value);
          if (errors.email) setErrors(({ email: _email, ...rest }) => rest);
        }}
      />
      {errors.email && (
        <p id={emailErrorId} className="availability-alert__error">
          {errors.email}
        </p>
      )}
      <label className="availability-alert__consent">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          disabled={sending}
          aria-invalid={errors.consent ? 'true' : undefined}
          aria-describedby={errors.consent ? consentErrorId : undefined}
          onChange={(event) => {
            setConsent(event.currentTarget.checked);
            if (errors.consent) setErrors(({ consent: _consent, ...rest }) => rest);
          }}
        />
        <span>{AVAILABILITY_ALERT_COPY.consent}</span>
      </label>
      {errors.consent && (
        <p id={consentErrorId} className="availability-alert__error">
          {errors.consent}
        </p>
      )}
      {errors.form && (
        <p className="availability-alert__error" role="alert">
          {errors.form}
        </p>
      )}
      <div className="availability-alert__actions">
        <Button
          type="submit"
          size="lg"
          className="availability-alert__send"
          disabled={sending}
          aria-busy={sending ? 'true' : undefined}
        >
          {sending ? AVAILABILITY_ALERT_COPY.sending : AVAILABILITY_ALERT_COPY.send}
        </Button>
        <Button type="button" variant="link" disabled={sending} onClick={close}>
          {AVAILABILITY_ALERT_COPY.cancel}
        </Button>
      </div>
    </form>
  );
}
