import { useEffect, useReducer, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  buildServicesInquiryDraft,
  copyServicesInquiryText,
  SERVICES_INQUIRY_SERVICE_OPTIONS,
  type ServicesInquiryCopyStatus,
  type ServicesInquiryDraft,
  type ServicesInquiryService,
} from '@/components/services/services-inquiry';
import {
  PublicCheckoutApiError,
  type ServicesInquiryBody,
  type ServicesInquiryResponse,
  submitPublicServicesInquiry,
} from '@/lib/backend/public-checkout-api';

type ServicesInquiryFormProps = {
  email: string;
  submitInquiry?: (body: ServicesInquiryBody) => Promise<ServicesInquiryResponse>;
  submitText: string;
};

export const SERVICES_INQUIRY_DETAIL_PROMPTS = {
  General: {
    hint: 'Add any useful context.',
    label: 'Useful context',
  },
  'Tour Booking': {
    hint: 'Add the date, city, and venue if known.',
    label: 'Date / City / Venue',
  },
  'Merch Printing': {
    hint: 'Add the item, quantity, and deadline if known.',
    label: 'Item / Quantity / Deadline',
  },
  'Vinyl Printing': {
    hint: 'Add the format, quantity, and target date if known.',
    label: 'Format / Quantity / Target Date',
  },
} satisfies Record<ServicesInquiryService, { hint: string; label: string }>;

export type ServicesInquiryAdaptiveDetailsState = {
  service: ServicesInquiryService;
  serviceDetails: string;
};

export function selectServicesInquiryService(
  state: ServicesInquiryAdaptiveDetailsState,
  service: ServicesInquiryService,
): ServicesInquiryAdaptiveDetailsState {
  return { ...state, service };
}

export type ServicesInquiryFormValues = {
  bandOrProject: string;
  email: string;
  message: string;
  name: string;
  service: ServicesInquiryService;
  serviceDetails: string;
};

export type ServicesInquirySubmissionStatus = 'idle' | 'submitting' | 'field-error' | 'provider-error' | 'submitted';

export type ServicesInquiryFormState = {
  status: ServicesInquirySubmissionStatus;
  values: ServicesInquiryFormValues;
};

type ServicesInquiryFormAction =
  | {
      field: Exclude<keyof ServicesInquiryFormValues, 'service'>;
      type: 'change';
      value: string;
    }
  | { service: ServicesInquiryService; type: 'select-service' }
  | { status: ServicesInquirySubmissionStatus; type: 'status' }
  | { type: 'reset' };

export function createInitialServicesInquiryFormState(): ServicesInquiryFormState {
  return {
    status: 'idle',
    values: {
      bandOrProject: '',
      email: '',
      message: '',
      name: '',
      service: 'General',
      serviceDetails: '',
    },
  };
}

export function reduceServicesInquiryFormState(
  state: ServicesInquiryFormState,
  action: ServicesInquiryFormAction,
): ServicesInquiryFormState {
  if (action.type === 'reset') return createInitialServicesInquiryFormState();
  if (action.type === 'status') return { ...state, status: action.status };

  const status = state.status === 'field-error' || state.status === 'provider-error' ? 'idle' : state.status;

  if (action.type === 'select-service') {
    const adaptiveDetails = selectServicesInquiryService(
      { service: state.values.service, serviceDetails: state.values.serviceDetails },
      action.service,
    );
    return { status, values: { ...state.values, ...adaptiveDetails } };
  }

  return { status, values: { ...state.values, [action.field]: action.value } };
}

type ServicesInquirySubmissionOptions = {
  onStatusChange: (status: ServicesInquirySubmissionStatus) => void;
  pending: { current: boolean };
  submitInquiry: (body: ServicesInquiryBody) => Promise<ServicesInquiryResponse>;
  values: ServicesInquiryFormValues;
};

function isKnownService(value: string): value is ServicesInquiryService {
  return SERVICES_INQUIRY_SERVICE_OPTIONS.includes(value as ServicesInquiryService);
}

export function classifyServicesInquirySubmissionError(error: unknown): 'field-error' | 'provider-error' {
  return error instanceof PublicCheckoutApiError && error.status === 400 ? 'field-error' : 'provider-error';
}

export async function submitServicesInquiryForm({
  onStatusChange,
  pending,
  submitInquiry,
  values,
}: ServicesInquirySubmissionOptions): Promise<boolean> {
  if (pending.current) return false;

  pending.current = true;
  onStatusChange('submitting');

  const serviceDetails = values.serviceDetails.trim();
  const body: ServicesInquiryBody = {
    ...(values.bandOrProject ? { bandOrProject: values.bandOrProject } : {}),
    email: values.email,
    message: values.message,
    name: values.name,
    service: values.service,
    ...(serviceDetails ? { serviceDetails } : {}),
  };

  try {
    await submitInquiry(body);
    onStatusChange('submitted');
    return true;
  } catch (error) {
    onStatusChange(classifyServicesInquirySubmissionError(error));
    return false;
  } finally {
    pending.current = false;
  }
}

export function ServicesInquirySubmissionFeedback({ status }: { status: ServicesInquirySubmissionStatus }) {
  const errorMessage =
    status === 'field-error'
      ? 'Check the highlighted fields and try again. Your details are still here.'
      : status === 'provider-error'
        ? "We couldn't submit your inquiry right now. Your details are still here; try again."
        : '';

  return (
    <div className="services-inquiry-form__feedback">
      <p className="services-inquiry-form__meta" role="status" aria-live="polite" aria-atomic="true">
        {status === 'submitting' ? 'Sending inquiry.' : ''}
      </p>
      {errorMessage ? (
        <p
          className="services-inquiry-form__error"
          id={status === 'field-error' ? 'services-inquiry-field-error' : undefined}
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export function ServicesInquirySuccess({
  onSendAnother,
  successRef,
}: {
  onSendAnother: () => void;
  successRef?: React.Ref<HTMLElement>;
}) {
  return (
    <section
      className="services-inquiry-form__success"
      aria-labelledby="services-inquiry-success-title"
      aria-live="polite"
      ref={successRef}
      role="status"
      tabIndex={-1}
    >
      <h3 className="services-inquiry-form__success-title" id="services-inquiry-success-title">
        Inquiry submitted
      </h3>
      <p className="services-inquiry-form__success-copy">
        Your inquiry was submitted. We'll follow up at the email address you provided.
      </p>
      <Button
        className="services-inquiry-form__submit h-12 rounded-none border border-[rgba(199,137,151,0.52)] bg-[rgba(138,73,90,0.14)] px-5 text-[11px] tracking-[0.2em] uppercase text-[#f4e7ea] hover:border-[rgba(199,137,151,0.74)] hover:bg-[rgba(138,73,90,0.22)] hover:text-[#fff5f7]"
        onClick={onSendAnother}
        type="button"
        variant="outline"
      >
        Send another inquiry
      </Button>
    </section>
  );
}

export function ServicesInquiryEmailFallback({
  copyStatus,
  draft,
  onCopy,
}: {
  copyStatus: 'idle' | ServicesInquiryCopyStatus;
  draft: ServicesInquiryDraft;
  onCopy: () => void;
}) {
  const copyMessage =
    copyStatus === 'copied'
      ? 'Inquiry details copied.'
      : copyStatus === 'manual'
        ? 'Copy unavailable. Select the recipient and inquiry summary below, then copy them manually.'
        : '';

  return (
    <section
      aria-labelledby="services-inquiry-email-fallback-title"
      className="grid max-w-[42rem] gap-3 border-t border-[#2b2b2b] pt-4"
    >
      <h3 className="services-inquiry-form__label m-0" id="services-inquiry-email-fallback-title">
        Email fallback
      </h3>
      <div className="flex flex-wrap items-center gap-3">
        <a className="services-inline-link inline-flex min-h-11 items-center" href={draft.mailtoHref}>
          Open in email app
        </a>
        <Button
          className="h-11 rounded-none border-[#2b2b2b] bg-[#111111] px-4 text-[11px] tracking-[0.16em] uppercase text-[#f3f3f3] hover:border-[rgba(199,137,151,0.74)] hover:bg-[#161616]"
          onClick={onCopy}
          type="button"
          variant="outline"
        >
          Copy inquiry details
        </Button>
      </div>
      <p className="m-0 text-sm leading-6 text-[#b3b3b3]">
        Recipient:{' '}
        <span className="select-text break-all text-[#f3f3f3]" data-services-inquiry-recipient>
          {draft.recipientEmail}
        </span>
      </p>
      <div className="grid gap-2">
        <p className="services-inquiry-form__label m-0">Inquiry summary</p>
        <pre
          aria-label="Inquiry summary"
          className="m-0 max-w-full select-text whitespace-pre-wrap break-words border border-[#2b2b2b] bg-[#111111] p-3 font-mono text-xs leading-6 text-[#d8d8d8]"
          data-services-inquiry-summary
        >
          {draft.summary}
        </pre>
      </div>
      <p
        aria-atomic="true"
        aria-live="polite"
        className="services-inquiry-form__meta m-0 min-h-6"
        id="services-inquiry-copy-status"
        role="status"
      >
        {copyMessage}
      </p>
    </section>
  );
}

export default function ServicesInquiryForm({
  submitInquiry = submitPublicServicesInquiry,
  submitText,
}: ServicesInquiryFormProps) {
  const [state, dispatch] = useReducer(
    reduceServicesInquiryFormState,
    undefined,
    createInitialServicesInquiryFormState,
  );
  const [copyStatus, setCopyStatus] = useState<'idle' | ServicesInquiryCopyStatus>('idle');
  const pendingSubmissionRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLElement>(null);
  const isSubmitting = state.status === 'submitting';
  const hasFieldError = state.status === 'field-error';
  const fieldErrorDescriptionId = hasFieldError ? 'services-inquiry-field-error' : undefined;
  const { bandOrProject, email: contactEmail, message, name, service, serviceDetails } = state.values;
  const detailPrompt = SERVICES_INQUIRY_DETAIL_PROMPTS[service];
  const inquiryDraft = buildServicesInquiryDraft(state.values);

  useEffect(() => {
    if (state.status === 'submitted') successRef.current?.focus();
  }, [state.status]);

  useEffect(() => {
    setCopyStatus('idle');
  }, [inquiryDraft.copyText]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const eventTarget = event.target;
      if (!(eventTarget instanceof HTMLElement)) return;

      const triggerElement = eventTarget.closest<HTMLElement>('[data-services-inquiry-target-service]');
      if (!triggerElement) return;

      const nextService = triggerElement.dataset.servicesInquiryTargetService || 'General';
      if (isKnownService(nextService)) {
        dispatch({ service: nextService, type: 'select-service' });
      } else {
        dispatch({ service: 'General', type: 'select-service' });
      }
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  if (state.status === 'submitted') {
    return (
      <ServicesInquirySuccess
        onSendAnother={() => {
          dispatch({ type: 'reset' });
          window.requestAnimationFrame(() => nameInputRef.current?.focus());
        }}
        successRef={successRef}
      />
    );
  }

  return (
    <form
      aria-busy={isSubmitting || undefined}
      className="services-inquiry-form"
      onInvalid={() => dispatch({ status: 'field-error', type: 'status' })}
      onSubmit={(event) => {
        event.preventDefault();
        void submitServicesInquiryForm({
          onStatusChange: (status) => dispatch({ status, type: 'status' }),
          pending: pendingSubmissionRef,
          submitInquiry,
          values: state.values,
        });
      }}
    >
      <div className="services-inquiry-form__grid">
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Name</span>
          <Input
            aria-describedby={fieldErrorDescriptionId}
            aria-invalid={hasFieldError || undefined}
            autoComplete="name"
            className="services-inquiry-form__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
            disabled={isSubmitting}
            maxLength={100}
            name="name"
            ref={nameInputRef}
            required
            value={name}
            onChange={(event) => dispatch({ field: 'name', type: 'change', value: event.target.value })}
          />
        </label>
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Email</span>
          <Input
            aria-describedby={fieldErrorDescriptionId}
            aria-invalid={hasFieldError || undefined}
            autoComplete="email"
            className="services-inquiry-form__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
            disabled={isSubmitting}
            maxLength={254}
            name="email"
            required
            type="email"
            value={contactEmail}
            onChange={(event) => dispatch({ field: 'email', type: 'change', value: event.target.value })}
          />
        </label>
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Band / Project</span>
          <Input
            className="services-inquiry-form__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
            disabled={isSubmitting}
            maxLength={160}
            name="band-or-project"
            value={bandOrProject}
            onChange={(event) => dispatch({ field: 'bandOrProject', type: 'change', value: event.target.value })}
          />
        </label>
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Service</span>
          <select
            aria-describedby={fieldErrorDescriptionId}
            aria-invalid={hasFieldError || undefined}
            className="services-inquiry-form__select h-11 w-full rounded-none border border-[#2b2b2b] bg-[#111111] px-3 text-[0.95rem] text-foreground outline-none"
            disabled={isSubmitting}
            name="service"
            required
            value={service}
            onChange={(event) => {
              const nextValue = event.target.value;
              dispatch({
                service: isKnownService(nextValue) ? nextValue : 'General',
                type: 'select-service',
              });
            }}
          >
            {SERVICES_INQUIRY_SERVICE_OPTIONS.map((serviceOption) => (
              <option key={serviceOption} value={serviceOption}>
                {serviceOption}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="services-inquiry-form__field" htmlFor="services-inquiry-details">
        <span className="services-inquiry-form__label">{detailPrompt.label}</span>
        <Input
          aria-describedby="services-inquiry-details-hint"
          className="services-inquiry-form__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
          disabled={isSubmitting}
          id="services-inquiry-details"
          maxLength={300}
          name="serviceDetails"
          value={serviceDetails}
          onChange={(event) => dispatch({ field: 'serviceDetails', type: 'change', value: event.target.value })}
        />
        <span className="text-sm leading-6 text-[#b3b3b3]" id="services-inquiry-details-hint">
          {detailPrompt.hint}
        </span>
      </label>

      <label className="services-inquiry-form__field">
        <span className="services-inquiry-form__label">Message</span>
        <Textarea
          aria-describedby={fieldErrorDescriptionId}
          aria-invalid={hasFieldError || undefined}
          className="services-inquiry-form__textarea rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
          disabled={isSubmitting}
          maxLength={2000}
          name="message"
          required
          value={message}
          onChange={(event) => dispatch({ field: 'message', type: 'change', value: event.target.value })}
        />
      </label>

      <div className="services-inquiry-form__actions">
        <Button
          className="services-inquiry-form__submit h-12 rounded-none border border-[rgba(199,137,151,0.52)] bg-[rgba(138,73,90,0.14)] px-5 text-[11px] tracking-[0.2em] uppercase text-[#f4e7ea] hover:border-[rgba(199,137,151,0.74)] hover:bg-[rgba(138,73,90,0.22)] hover:text-[#fff5f7]"
          aria-busy={isSubmitting ? 'true' : undefined}
          disabled={isSubmitting}
          type="submit"
          variant="outline"
        >
          {isSubmitting ? 'Sending inquiry…' : submitText}
        </Button>
        <ServicesInquirySubmissionFeedback status={state.status} />
      </div>
      <ServicesInquiryEmailFallback
        copyStatus={copyStatus}
        draft={inquiryDraft}
        onCopy={() => {
          void copyServicesInquiryText(
            typeof navigator === 'undefined' ? undefined : navigator.clipboard,
            inquiryDraft.copyText,
          ).then(setCopyStatus);
        }}
      />
    </form>
  );
}
