import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SERVICES_INQUIRY_SERVICE_OPTIONS, type ServicesInquiryService } from '@/components/services/services-inquiry';
import {
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

export type ServicesInquirySubmissionStatus = 'idle' | 'submitting' | 'submitted' | 'error';

type ServicesInquirySubmissionOptions = {
  onStatusChange: (status: ServicesInquirySubmissionStatus) => void;
  pending: { current: boolean };
  submitInquiry: (body: ServicesInquiryBody) => Promise<ServicesInquiryResponse>;
  values: ServicesInquiryFormValues;
};

function isKnownService(value: string): value is ServicesInquiryService {
  return SERVICES_INQUIRY_SERVICE_OPTIONS.includes(value as ServicesInquiryService);
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
  } catch {
    onStatusChange('error');
    return false;
  } finally {
    pending.current = false;
  }
}

export default function ServicesInquiryForm({
  submitInquiry = submitPublicServicesInquiry,
  submitText,
}: ServicesInquiryFormProps) {
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bandOrProject, setBandOrProject] = useState('');
  const [adaptiveDetails, setAdaptiveDetails] = useState<ServicesInquiryAdaptiveDetailsState>({
    service: 'General',
    serviceDetails: '',
  });
  const [message, setMessage] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState<ServicesInquirySubmissionStatus>('idle');
  const pendingSubmissionRef = useRef(false);
  const isSubmitting = submissionStatus === 'submitting';
  const { service, serviceDetails } = adaptiveDetails;
  const detailPrompt = SERVICES_INQUIRY_DETAIL_PROMPTS[service];

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const eventTarget = event.target;
      if (!(eventTarget instanceof HTMLElement)) return;

      const triggerElement = eventTarget.closest<HTMLElement>('[data-services-inquiry-target-service]');
      if (!triggerElement) return;

      const nextService = triggerElement.dataset.servicesInquiryTargetService || 'General';
      if (isKnownService(nextService)) {
        setAdaptiveDetails((current) => selectServicesInquiryService(current, nextService));
      } else {
        setAdaptiveDetails((current) => selectServicesInquiryService(current, 'General'));
      }
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const statusMessage =
    submissionStatus === 'submitting'
      ? 'Sending inquiry.'
      : submissionStatus === 'submitted'
        ? 'Inquiry submitted.'
        : submissionStatus === 'error'
          ? 'Could not send inquiry. Your details are still here; try again.'
          : '';

  return (
    <form
      className="services-inquiry-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submitServicesInquiryForm({
          onStatusChange: setSubmissionStatus,
          pending: pendingSubmissionRef,
          submitInquiry,
          values: {
            bandOrProject,
            email: contactEmail,
            message,
            name,
            service,
            serviceDetails,
          },
        });
      }}
    >
      <div className="services-inquiry-form__grid">
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Name</span>
          <Input
            autoComplete="name"
            className="services-inquiry-form__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
            disabled={isSubmitting}
            maxLength={100}
            name="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Email</span>
          <Input
            autoComplete="email"
            className="services-inquiry-form__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
            disabled={isSubmitting}
            maxLength={254}
            name="email"
            required
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
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
            onChange={(event) => setBandOrProject(event.target.value)}
          />
        </label>
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Service</span>
          <select
            className="services-inquiry-form__select h-11 w-full rounded-none border border-[#2b2b2b] bg-[#111111] px-3 text-[0.95rem] text-foreground outline-none"
            disabled={isSubmitting}
            name="service"
            required
            value={service}
            onChange={(event) => {
              const nextValue = event.target.value;
              setAdaptiveDetails((current) =>
                selectServicesInquiryService(current, isKnownService(nextValue) ? nextValue : 'General'),
              );
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
          onChange={(event) => setAdaptiveDetails((current) => ({ ...current, serviceDetails: event.target.value }))}
        />
        <span className="text-sm leading-6 text-[#b3b3b3]" id="services-inquiry-details-hint">
          {detailPrompt.hint}
        </span>
      </label>

      <label className="services-inquiry-form__field">
        <span className="services-inquiry-form__label">Message</span>
        <Textarea
          className="services-inquiry-form__textarea rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
          disabled={isSubmitting}
          maxLength={2000}
          name="message"
          required
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      <div className="services-inquiry-form__actions">
        <Button
          className="services-inquiry-form__submit h-12 rounded-none border border-[rgba(199,137,151,0.52)] bg-[rgba(138,73,90,0.14)] px-5 text-[11px] tracking-[0.2em] uppercase text-[#f4e7ea] hover:border-[rgba(199,137,151,0.74)] hover:bg-[rgba(138,73,90,0.22)] hover:text-[#fff5f7]"
          aria-busy={isSubmitting ? 'true' : undefined}
          disabled={isSubmitting || submissionStatus === 'submitted'}
          type="submit"
          variant="outline"
        >
          {submitText}
        </Button>
        <p className="services-inquiry-form__meta" role="status" aria-live="polite" aria-atomic="true">
          {statusMessage}
        </p>
      </div>
    </form>
  );
}
