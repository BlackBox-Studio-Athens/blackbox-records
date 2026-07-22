import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildServicesInquiryEmail,
  createServicesInquiryEmailTags,
  readEmailRuntimeConfig,
  SERVICES_INQUIRY_EMAIL_PURPOSE,
  SERVICES_INQUIRY_FIELD_LIMITS,
  SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE,
  sendServicesInquiry,
  validateServicesInquiryInput,
} from '../../../src/application/email';
import type { EmailProviderGateway, ProviderEmailMessage } from '../../../src/application/email';

const validInquiry = {
  email: 'visitor@example.com',
  message: 'We need help with an upcoming release.',
  name: 'Visitor Name',
  service: 'General' as const,
};

const localConfig = readEmailRuntimeConfig({
  EMAIL_BRAND_HOME_URL: 'https://blackbox-studio-athens.github.io/blackbox-records/',
  EMAIL_BRAND_LOGO_URL:
    'https://blackbox-studio-athens.github.io/blackbox-records/assets/images/brand/logo-horizontal.png',
  PRODUCT_ENVIRONMENT: 'LOCAL',
  RESEND_API_KEY: 're_mock_blackbox_local',
  RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
  RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
  RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
  RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
});

const uatConfig = readEmailRuntimeConfig({
  ...runtimeBindings('UAT'),
  RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL: 'uat-sink@ambkime.resend.app',
});

const prdConfig = readEmailRuntimeConfig(runtimeBindings('PRD'));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('services inquiry email application input', () => {
  it('owns the fixed service recipient aliases', () => {
    expect(SERVICES_INQUIRY_RECIPIENT_ALIAS_BY_SERVICE).toEqual({
      General: 'info@blackboxrecordsathens.com',
      'Tour Booking': 'booking@blackboxrecordsathens.com',
      'Merch Printing': 'merch@blackboxrecordsathens.com',
      'Vinyl Printing': 'vinyl@blackboxrecordsathens.com',
    });
  });

  it('trims valid input and removes blank optional values', () => {
    expect(
      validateServicesInquiryInput({
        ...validInquiry,
        bandOrProject: '   ',
        email: '  visitor@example.com  ',
        message: '  We need help with an upcoming release.  ',
        name: '  Visitor Name  ',
        serviceDetails: '  Useful context  ',
      }),
    ).toEqual({
      email: 'visitor@example.com',
      message: 'We need help with an upcoming release.',
      name: 'Visitor Name',
      service: 'General',
      serviceDetails: 'Useful context',
    });
  });

  it('accepts values at every field limit', () => {
    const result = validateServicesInquiryInput({
      bandOrProject: 'b'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject),
      email: `${'e'.repeat(242)}@example.com`,
      message: 'm'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.message),
      name: 'n'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.name),
      service: 'Tour Booking',
      serviceDetails: 'd'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails),
    });

    expect(result.name).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.name);
    expect(result.email).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.email);
    expect(result.bandOrProject).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject);
    expect(result.serviceDetails).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails);
    expect(result.message).toHaveLength(SERVICES_INQUIRY_FIELD_LIMITS.message);
  });

  it.each([
    ['name', { ...validInquiry, name: 'n'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.name + 1) }],
    ['email', { ...validInquiry, email: `${'e'.repeat(243)}@example.com` }],
    ['bandOrProject', { ...validInquiry, bandOrProject: 'b'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject + 1) }],
    [
      'serviceDetails',
      { ...validInquiry, serviceDetails: 'd'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails + 1) },
    ],
    ['message', { ...validInquiry, message: 'm'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.message + 1) }],
  ])('rejects %s beyond its field limit', (_field, input) => {
    expect(() => validateServicesInquiryInput(input)).toThrow();
  });

  it.each(['name', 'email', 'message'] as const)('rejects blank required %s', (field) => {
    expect(() => validateServicesInquiryInput({ ...validInquiry, [field]: '   ' })).toThrow();
  });

  it('rejects invalid email, unsupported service, and unknown fields', () => {
    expect(() => validateServicesInquiryInput({ ...validInquiry, email: 'not-an-email' })).toThrow();
    expect(() => validateServicesInquiryInput({ ...validInquiry, service: 'Mastering' })).toThrow();
    expect(() => validateServicesInquiryInput({ ...validInquiry, recipient: 'attacker@example.com' })).toThrow();
  });

  it.each([
    ['General', 'general'],
    ['Tour Booking', 'tour-booking'],
    ['Merch Printing', 'merch-printing'],
    ['Vinyl Printing', 'vinyl-printing'],
  ] as const)('provides safe purpose and tags for %s', (service, serviceTag) => {
    expect(SERVICES_INQUIRY_EMAIL_PURPOSE).toBe('services-inquiry');
    expect(createServicesInquiryEmailTags(service)).toEqual([
      { name: 'category', value: 'services-inquiry' },
      { name: 'service', value: serviceTag },
    ]);
  });
});

describe('services inquiry email template', () => {
  it('uses the approved subject and field order', () => {
    const content = buildServicesInquiryEmail({
      ...validInquiry,
      bandOrProject: 'Night Shift',
      service: 'Tour Booking',
      serviceDetails: 'October / Athens / Temple',
    });

    expect(content.subject).toBe('Services Inquiry — Tour Booking — Night Shift');
    expectInOrder(content.html, [
      '>Service</th>',
      '>Tour Booking</td>',
      '>Name</th>',
      '>Visitor Name</td>',
      '>Email</th>',
      '>visitor@example.com</td>',
      '>Band / Project</th>',
      '>Night Shift</td>',
      '>Date / City / Venue</th>',
      '>October / Athens / Temple</td>',
      '>Message</div>',
      '>We need help with an upcoming release.</div>',
    ]);
    expectInOrder(content.text, [
      'Service: Tour Booking',
      'Name: Visitor Name',
      'Email: visitor@example.com',
      'Band / Project: Night Shift',
      'Date / City / Venue: October / Athens / Temple',
      'Message:\nWe need help with an upcoming release.',
    ]);
  });

  it('escapes every visitor value in HTML and shows the email once', () => {
    const content = buildServicesInquiryEmail({
      bandOrProject: '"Band" & Friends',
      email: 'visitor+tag@example.com',
      message: '<script>alert("message")</script> & goodbye',
      name: '<Visitor & Co>',
      service: 'Merch Printing',
      serviceDetails: '100 < shirts & "fast"',
    });

    expect(content.html).toContain('&lt;Visitor &amp; Co&gt;');
    expect(content.html).toContain('&quot;Band&quot; &amp; Friends');
    expect(content.html).toContain('100 &lt; shirts &amp; &quot;fast&quot;');
    expect(content.html).toContain('&lt;script&gt;alert(&quot;message&quot;)&lt;/script&gt; &amp; goodbye');
    expect(content.html).not.toContain('<script>alert("message")</script>');
    expect(content.html.match(/visitor\+tag@example\.com/g)).toHaveLength(1);
  });

  it('omits optional fields and falls back to the visitor name in the subject', () => {
    const content = buildServicesInquiryEmail(validateServicesInquiryInput(validInquiry));

    expect(content.subject).toBe('Services Inquiry — General — Visitor Name');
    expect(content.html).not.toContain('Band / Project');
    expect(content.html).not.toContain('Useful context');
    expect(content.text).not.toContain('Band / Project');
    expect(content.text).not.toContain('Useful context');
  });

  it('keeps HTML and plain text operationally equivalent', () => {
    const input = {
      ...validInquiry,
      bandOrProject: 'Night Shift',
      service: 'Vinyl Printing' as const,
      serviceDetails: '12 inch / 300 / November',
    };
    const content = buildServicesInquiryEmail(input);
    const fields = [
      ['Service', input.service],
      ['Name', input.name],
      ['Email', input.email],
      ['Band / Project', input.bandOrProject],
      ['Format / Quantity / Target Date', input.serviceDetails],
    ];

    for (const [label, value] of fields) {
      expect(content.html).toContain(`>${label}</th>`);
      expect(content.html).toContain(`>${value}</td>`);
      expect(content.text).toContain(`${label}: ${value}`);
    }
    expect(content.html).toContain(`>${input.message}</div>`);
    expect(content.text).toContain(`Message:\n${input.message}`);
    expect(content.html).toContain('Reply to this email to contact the visitor.');
    expect(content.text).toContain('Reply to this email to contact the visitor.');
  });
});

describe('services inquiry send use case', () => {
  it.each([
    ['General', 'info@blackboxrecordsathens.com', 'general'],
    ['Tour Booking', 'booking@blackboxrecordsathens.com', 'tour-booking'],
    ['Merch Printing', 'merch@blackboxrecordsathens.com', 'merch-printing'],
    ['Vinyl Printing', 'vinyl@blackboxrecordsathens.com', 'vinyl-printing'],
  ] as const)('sends %s to its fixed PRD alias', async (service, recipient, serviceTag) => {
    mockRandomUuid('11111111-1111-4111-8111-111111111111');
    const { provider, sendEmail } = createProvider();

    const result = await sendServicesInquiry({
      config: prdConfig,
      inquiry: { ...validInquiry, service },
      logger: createLogger(),
      provider,
    });

    expect(result).toEqual(
      expect.objectContaining({
        idempotencyKey: 'blackbox:prd:services-inquiry:11111111-1111-4111-8111-111111111111',
        routedRecipient: {
          intendedRecipient: recipient,
          isSinkRouted: false,
          to: recipient,
        },
        status: 'sent',
      }),
    );
    expect(sentMessage(sendEmail)).toEqual(
      expect.objectContaining({
        idempotencyKey: 'blackbox:prd:services-inquiry:11111111-1111-4111-8111-111111111111',
        replyTo: 'visitor@example.com',
        tags: expect.arrayContaining([
          { name: 'purpose', value: 'services-inquiry' },
          { name: 'environment', value: 'prd' },
          { name: 'sink_routed', value: 'false' },
          { name: 'category', value: 'services-inquiry' },
          { name: 'service', value: serviceTag },
        ]),
        to: recipient,
      }),
    );
  });

  it('routes UAT delivery to the managed sink while preserving intended alias metadata', async () => {
    mockRandomUuid('22222222-2222-4222-8222-222222222222');
    const { provider, sendEmail } = createProvider();

    const result = await sendServicesInquiry({
      config: uatConfig,
      inquiry: { ...validInquiry, service: 'Tour Booking' },
      logger: createLogger(),
      provider,
    });

    expect(result.routedRecipient).toEqual({
      intendedRecipient: 'booking@blackboxrecordsathens.com',
      isSinkRouted: true,
      to: 'uat-sink@ambkime.resend.app',
    });
    expect(sentMessage(sendEmail)).toEqual(
      expect.objectContaining({
        idempotencyKey: 'blackbox:uat:services-inquiry:22222222-2222-4222-8222-222222222222',
        tags: expect.arrayContaining([{ name: 'sink_routed', value: 'true' }]),
        to: 'uat-sink@ambkime.resend.app',
      }),
    );
  });

  it('keeps Local delivery on the provided mock gateway without remote routing', async () => {
    mockRandomUuid('33333333-3333-4333-8333-333333333333');
    const { provider, sendEmail } = createProvider();

    await sendServicesInquiry({
      config: localConfig,
      inquiry: validInquiry,
      logger: createLogger(),
      provider,
    });

    expect(sentMessage(sendEmail)).toEqual(
      expect.objectContaining({
        idempotencyKey: 'blackbox:local:services-inquiry:33333333-3333-4333-8333-333333333333',
        to: 'info@blackboxrecordsathens.com',
      }),
    );
  });

  it('generates Worker-owned idempotency before provider delivery', async () => {
    const randomUuid = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('44444444-4444-4444-8444-444444444444')
      .mockReturnValueOnce('55555555-5555-4555-8555-555555555555');
    const { provider, sendEmail } = createProvider();

    await sendServicesInquiry({ config: prdConfig, inquiry: validInquiry, logger: createLogger(), provider });
    await sendServicesInquiry({ config: prdConfig, inquiry: validInquiry, logger: createLogger(), provider });

    expect(randomUuid).toHaveBeenCalledTimes(2);
    expect(sendEmail.mock.calls.map(([message]) => message.idempotencyKey)).toEqual([
      'blackbox:prd:services-inquiry:44444444-4444-4444-8444-444444444444',
      'blackbox:prd:services-inquiry:55555555-5555-4555-8555-555555555555',
    ]);
  });

  it('rejects invalid inquiry input before id generation, provider delivery, or logging', async () => {
    const randomUuid = vi.spyOn(crypto, 'randomUUID');
    const { provider, sendEmail } = createProvider();
    const logger = createLogger();

    await expect(
      sendServicesInquiry({
        config: prdConfig,
        inquiry: { ...validInquiry, recipient: 'attacker@example.com' },
        logger,
        provider,
      }),
    ).rejects.toThrow();

    expect(randomUuid).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each([
    ['configuration', false],
    ['idempotency_conflict_invalid', false],
    ['idempotency_conflict_retryable', true],
    ['provider_unavailable', true],
    ['quota_exceeded', false],
    ['rate_limited', true],
    ['validation', false],
    ['unknown', false],
  ] as const)('returns and logs provider-safe %s failure', async (reason, retryable) => {
    mockRandomUuid('66666666-6666-4666-8666-666666666666');
    const { provider } = createProvider({ ok: false, reason, retryable });
    const logger = createLogger();

    const result = await sendServicesInquiry({ config: prdConfig, inquiry: validInquiry, logger, provider });

    expect(result).toEqual(
      expect.objectContaining({
        providerSafeReason: reason,
        retryable,
        status: 'failed',
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith({
      event: 'services_inquiry_email_outcome',
      idempotencyKey: 'blackbox:prd:services-inquiry:66666666-6666-4666-8666-666666666666',
      retryable,
      safeReason: reason,
      service: 'general',
      sinkRouted: false,
      status: 'failed',
    });
  });

  it('logs only content-free outcome metadata', async () => {
    mockRandomUuid('77777777-7777-4777-8777-777777777777');
    const { provider } = createProvider();
    const logger = createLogger();
    const inquiry = {
      bandOrProject: 'Private Project',
      email: 'private@example.com',
      message: 'Private message body',
      name: 'Private Visitor',
      service: 'Vinyl Printing' as const,
      serviceDetails: 'Private service details',
    };

    await sendServicesInquiry({ config: uatConfig, inquiry, logger, provider });

    expect(logger.info).toHaveBeenCalledWith({
      event: 'services_inquiry_email_outcome',
      idempotencyKey: 'blackbox:uat:services-inquiry:77777777-7777-4777-8777-777777777777',
      retryable: false,
      safeReason: undefined,
      service: 'vinyl-printing',
      sinkRouted: true,
      status: 'sent',
    });
    const logged = JSON.stringify(logger.info.mock.calls);
    for (const visitorContent of Object.values(inquiry).filter((value) => value !== inquiry.service)) {
      expect(logged).not.toContain(visitorContent);
    }
  });
});

function expectInOrder(value: string, expectedParts: string[]): void {
  let previousIndex = -1;

  for (const part of expectedParts) {
    const index = value.indexOf(part, previousIndex + 1);
    expect(index, `Expected ${JSON.stringify(part)} after index ${previousIndex}`).toBeGreaterThan(previousIndex);
    previousIndex = index;
  }
}

function createProvider(result: Awaited<ReturnType<EmailProviderGateway['sendEmail']>> = { ok: true }) {
  const sendEmail = vi.fn<EmailProviderGateway['sendEmail']>(async () => result);

  return {
    provider: {
      registerNewsletterContact: vi.fn(),
      sendEmail,
    } satisfies EmailProviderGateway,
    sendEmail,
  };
}

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
  };
}

function mockRandomUuid(value: `${string}-${string}-${string}-${string}-${string}`): void {
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(value);
}

function sentMessage(sendEmail: ReturnType<typeof vi.fn<EmailProviderGateway['sendEmail']>>): ProviderEmailMessage {
  return sendEmail.mock.calls[0]?.[0] as ProviderEmailMessage;
}

function runtimeBindings(productEnvironment: 'PRD' | 'UAT') {
  const brandHomeUrl =
    productEnvironment === 'UAT'
      ? 'https://blackbox-studio-athens.github.io/blackbox-records/'
      : 'https://blackbox-records-web.pages.dev/';

  return {
    EMAIL_BRAND_HOME_URL: brandHomeUrl,
    EMAIL_BRAND_LOGO_URL: `${brandHomeUrl}assets/images/brand/logo-horizontal.png`,
    PRODUCT_ENVIRONMENT: productEnvironment,
    RESEND_API_KEY: 're_mock_blackbox_local',
    RESEND_FROM_EMAIL: 'orders@blackboxrecordsathens.com',
    RESEND_NEWSLETTER_TOPIC_ID: 'topic_mock_blackbox_newsletter',
    RESEND_OPS_TO_EMAIL: 'blackboxrecordsathens@gmail.com',
    RESEND_REPLY_TO_EMAIL: 'support@blackboxrecordsathens.com',
  };
}
