import * as React from 'react';
import { Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NEWSLETTER_CONSENT_LABEL, PrivacyLink } from '@/platform/components/PurchaseInformation';
import type { PublicCheckoutApi } from './public-checkout-api';

export const AVAILABILITY_ALERT_COPY = {
  open: 'Email me when it lands',
  email: 'Email',
  emailPlaceholder: 'you@example.com',
  consent: 'Email me once when this item can be bought or pre-ordered.',
  optional: 'Optional:',
  fine: 'BlackBox Records uses your email only for what you ticked. Alert requests are kept for up to 12 months. Withdraw anytime from the link we email you, or',
  manage: 'manage alerts',
  newTab: '(opens in a new tab)',
  send: 'Notify me',
  sending: 'Sending',
  cancel: 'Cancel',
  invalidEmail: 'Enter a valid email.',
  missingConsent: 'Tick the box so we can email you.',
  failed: "Couldn't save that. Try again.",
  done: (email: string) => `We'll email ${email} once it can be ordered.`,
  newsletterJoined: 'Check your inbox to confirm the newsletter request.',
  newsletterFailed: "The newsletter sign-up didn't go through. Use the newsletter form to try again.",
} as const;

export type AvailabilityAlertStep = 'closed' | 'open' | 'sending' | 'done';
export type AvailabilityAlertErrors = { email?: string; consent?: string; form?: string };
export type NewsletterOutcome = 'none' | 'joined' | 'failed';

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

// Runs only after the alert succeeded; a failure here never undoes the alert.
export async function joinNewsletter(api: PublicCheckoutApi | undefined, email: string): Promise<NewsletterOutcome> {
  try {
    const client = api ?? (await import('./public-checkout-api')).createPublicCheckoutApi();
    await client.registerNewsletterSignup({
      email: email.trim(),
      consentAccepted: true,
      source: 'availability-alert-form',
    });
    return 'joined';
  } catch {
    return 'failed';
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
  initial?: {
    step: AvailabilityAlertStep;
    email?: string;
    consent?: boolean;
    newsletter?: boolean;
    newsletterOutcome?: NewsletterOutcome;
    errors?: AvailabilityAlertErrors;
  };
  storeItemSlug: string;
}) {
  const id = React.useId();
  const [step, setStep] = React.useState<AvailabilityAlertStep>(initial?.step ?? 'closed');
  const [email, setEmail] = React.useState(initial?.email ?? '');
  const [consent, setConsent] = React.useState(initial?.consent ?? false);
  const [newsletter, setNewsletter] = React.useState(initial?.newsletter ?? false);
  const [newsletterOutcome, setNewsletterOutcome] = React.useState<NewsletterOutcome>(
    initial?.newsletterOutcome ?? 'none',
  );
  const [errors, setErrors] = React.useState<AvailabilityAlertErrors>(initial?.errors ?? {});
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);
  const consentRef = React.useRef<HTMLInputElement>(null);
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
      // Focus reads the first invalid control's error through its aria-describedby.
      (nextErrors.email ? emailRef : consentRef).current?.focus();
      return;
    }
    setStep('sending');
    const result = await sendAvailabilityAlert(api, storeItemSlug, email);
    if (result === 'done') {
      setNewsletterOutcome(newsletter ? await joinNewsletter(api, email) : 'none');
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
        className="availability-alert__open"
        data-availability-alert-open
        onClick={() => setStep('open')}
      >
        <Mail aria-hidden="true" strokeWidth={1.75} />
        <span className="availability-alert__open-label">{AVAILABILITY_ALERT_COPY.open}</span>
      </Button>
    );
  }

  if (step === 'done') {
    return (
      <p ref={doneRef} className="availability-alert__done" role="status" tabIndex={-1} data-availability-alert-done>
        <span aria-hidden="true">✓</span> {AVAILABILITY_ALERT_COPY.done(email.trim())}
        {newsletterOutcome === 'joined' && ` ${AVAILABILITY_ALERT_COPY.newsletterJoined}`}
        {newsletterOutcome === 'failed' && ` ${AVAILABILITY_ALERT_COPY.newsletterFailed}`}
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
      aria-labelledby={`${id}-title`}
      data-availability-alert-form
      onSubmit={(event) => void submit(event)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !sending) {
          event.preventDefault();
          close();
        }
      }}
    >
      <p id={`${id}-title`} className="availability-alert__title">
        <Mail aria-hidden="true" strokeWidth={1.75} />
        {AVAILABILITY_ALERT_COPY.open}
      </p>
      <label className="accessibility-visually-hidden-text" htmlFor={`${id}-email`}>
        {AVAILABILITY_ALERT_COPY.email}
      </label>
      <div className="availability-alert__row">
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
        <Button
          type="submit"
          className="availability-alert__send"
          disabled={sending}
          aria-busy={sending ? 'true' : undefined}
        >
          {sending ? AVAILABILITY_ALERT_COPY.sending : AVAILABILITY_ALERT_COPY.send}
        </Button>
      </div>
      {errors.email && (
        <p id={emailErrorId} className="availability-alert__error">
          <span className="form-error-label">Error</span>
          {errors.email}
        </p>
      )}
      <label className="availability-alert__consent">
        <input
          ref={consentRef}
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
          <span className="form-error-label">Error</span>
          {errors.consent}
        </p>
      )}
      <label className="availability-alert__consent">
        <input
          type="checkbox"
          name="newsletter"
          checked={newsletter}
          disabled={sending}
          onChange={(event) => setNewsletter(event.currentTarget.checked)}
        />
        <span>
          <span className="availability-alert__optional">{AVAILABILITY_ALERT_COPY.optional}</span>{' '}
          {NEWSLETTER_CONSENT_LABEL}
        </span>
      </label>
      <p className="availability-alert__fine">
        {AVAILABILITY_ALERT_COPY.fine}{' '}
        <a
          className="underline underline-offset-4"
          href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/email-preferences/`}
          // A separate tab keeps the shell and its player; the token page stays an isolated document.
          target="_blank"
          rel="noopener noreferrer"
        >
          {AVAILABILITY_ALERT_COPY.manage}
          <span className="sr-only"> {AVAILABILITY_ALERT_COPY.newTab}</span>
        </a>
        . <PrivacyLink />
      </p>
      {errors.form && (
        <p className="availability-alert__error" role="alert">
          <span className="form-error-label">Error</span>
          {errors.form}
        </p>
      )}
      <div className="availability-alert__actions">
        <Button type="button" variant="link" disabled={sending} onClick={close}>
          {AVAILABILITY_ALERT_COPY.cancel}
        </Button>
      </div>
    </form>
  );
}
