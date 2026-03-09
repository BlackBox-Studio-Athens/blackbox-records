import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  buildServicesInquiryMailto,
  openServicesInquiryMailtoInNewTab,
  SERVICES_INQUIRY_SERVICE_OPTIONS,
  type ServicesInquiryService,
} from '@/components/services/services-inquiry';

type ServicesInquiryFormProps = {
  email: string;
  submitText: string;
};

function isKnownService(value: string): value is ServicesInquiryService {
  return SERVICES_INQUIRY_SERVICE_OPTIONS.includes(value as ServicesInquiryService);
}

export default function ServicesInquiryForm({ email, submitText }: ServicesInquiryFormProps) {
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [bandOrProject, setBandOrProject] = useState('');
  const [service, setService] = useState<ServicesInquiryService>('General');
  const [message, setMessage] = useState('');

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const eventTarget = event.target;
      if (!(eventTarget instanceof HTMLElement)) return;

      const triggerElement = eventTarget.closest<HTMLElement>('[data-services-inquiry-target-service]');
      if (!triggerElement) return;

      const nextService = triggerElement.dataset.servicesInquiryTargetService || 'General';
      if (isKnownService(nextService)) {
        setService(nextService);
      } else {
        setService('General');
      }
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const mailtoHref = useMemo(
    () =>
      buildServicesInquiryMailto({
        bandOrProject,
        email: contactEmail,
        message,
        name,
        recipientEmail: email,
        service,
      }),
    [bandOrProject, contactEmail, email, message, name, service],
  );

  return (
    <form
      className="services-inquiry-form"
      onSubmit={(event) => {
        event.preventDefault();
        openServicesInquiryMailtoInNewTab({
          mailtoHref,
          navigateToHref: (href) => {
            window.location.href = href;
          },
          openWindow: (href, target, features) => window.open(href, target, features),
        });
      }}
    >
      <div className="services-inquiry-form__grid">
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Name</span>
          <Input
            autoComplete="name"
            className="services-inquiry-form__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Email</span>
          <Input
            autoComplete="email"
            className="services-inquiry-form__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
            name="email"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
          />
        </label>
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Band / Project</span>
          <Input
            className="services-inquiry-form__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
            name="band-or-project"
            value={bandOrProject}
            onChange={(event) => setBandOrProject(event.target.value)}
          />
        </label>
        <label className="services-inquiry-form__field">
          <span className="services-inquiry-form__label">Service</span>
          <select
            className="services-inquiry-form__select h-11 w-full rounded-none border border-[#2b2b2b] bg-[#111111] px-3 text-[0.95rem] text-foreground outline-none"
            name="service"
            value={service}
            onChange={(event) => {
              const nextValue = event.target.value;
              setService(isKnownService(nextValue) ? nextValue : 'General');
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

      <label className="services-inquiry-form__field">
        <span className="services-inquiry-form__label">Message</span>
        <Textarea
          className="services-inquiry-form__textarea rounded-none border-[#2b2b2b] bg-[#111111] text-[0.95rem]"
          name="message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      <div className="services-inquiry-form__actions">
        <Button
          className="services-inquiry-form__submit h-12 rounded-none border border-[rgba(199,137,151,0.52)] bg-[rgba(138,73,90,0.14)] px-5 text-[11px] tracking-[0.2em] uppercase text-[#f4e7ea] hover:border-[rgba(199,137,151,0.74)] hover:bg-[rgba(138,73,90,0.22)] hover:text-[#fff5f7]"
          type="submit"
          variant="outline"
        >
          {submitText}
        </Button>
        <p className="services-inquiry-form__meta">This opens your email client with the inquiry prefilled.</p>
      </div>
    </form>
  );
}
