import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';

import { SERVICES_INQUIRY_FIELD_LIMITS, SERVICES_INQUIRY_SERVICES } from '../../src/application/email';
import {
  postServicesInquiryRoute,
  servicesInquiryBodySchema,
  servicesInquiryResponseSchema,
} from '../../src/interfaces/http/contracts/public-contracts';

const validInquiry = {
  email: 'visitor@example.com',
  message: 'Tell me more.',
  name: 'Visitor',
  service: 'General' as const,
};

describe('Services inquiry public contract', () => {
  it('accepts exact field limits and rejects unknown fields', () => {
    expect(
      servicesInquiryBodySchema.parse({
        bandOrProject: 'b'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject),
        email: `${'e'.repeat(242)}@example.com`,
        message: 'm'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.message),
        name: 'n'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.name),
        service: 'Vinyl Printing',
        serviceDetails: 'd'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails),
      }),
    ).toBeDefined();

    expect(servicesInquiryBodySchema.safeParse({ ...validInquiry, recipient: 'attacker@example.com' }).success).toBe(
      false,
    );
  });

  it.each([
    ['name required', { ...validInquiry, name: ' ' }],
    ['email required', { ...validInquiry, email: ' ' }],
    ['email format', { ...validInquiry, email: 'invalid' }],
    ['service required', { email: validInquiry.email, message: validInquiry.message, name: validInquiry.name }],
    ['message required', { ...validInquiry, message: ' ' }],
    ['name limit', { ...validInquiry, name: 'n'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.name + 1) }],
    ['email limit', { ...validInquiry, email: `${'e'.repeat(243)}@example.com` }],
    [
      'Band / Project limit',
      { ...validInquiry, bandOrProject: 'b'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject + 1) },
    ],
    ['service value', { ...validInquiry, service: 'Mastering' }],
    [
      'service details limit',
      { ...validInquiry, serviceDetails: 'd'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails + 1) },
    ],
    ['message limit', { ...validInquiry, message: 'm'.repeat(SERVICES_INQUIRY_FIELD_LIMITS.message + 1) }],
  ])('rejects invalid %s input', (_caseName, input) => {
    expect(servicesInquiryBodySchema.safeParse(input).success).toBe(false);
  });

  it('reserves success for submitted and rejects extra response fields', () => {
    expect(servicesInquiryResponseSchema.parse({ status: 'submitted' })).toEqual({ status: 'submitted' });
    expect(servicesInquiryResponseSchema.safeParse({ status: 'delivered' }).success).toBe(false);
    expect(servicesInquiryResponseSchema.safeParse({ providerId: 'provider_123', status: 'submitted' }).success).toBe(
      false,
    );
  });

  it('emits strict request, success, validation, and provider-safe unavailable responses', () => {
    const app = new OpenAPIHono();
    app.openapi(postServicesInquiryRoute, (context) => context.json({ status: 'submitted' as const }, 200));
    const document = app.getOpenAPI31Document({
      info: { title: 'Services inquiry contract test', version: '1.0.0' },
      openapi: '3.1.0',
    });
    const operation = document.paths?.['/api/services/inquiries']?.post;
    const requestSchema = document.components?.schemas?.ServicesInquiryBody as {
      additionalProperties?: boolean;
      properties?: Record<string, { enum?: string[]; maxLength?: number }>;
      required?: string[];
    };
    const successSchema = document.components?.schemas?.ServicesInquiryResponse as {
      additionalProperties?: boolean;
      properties?: { status?: { enum?: string[] } };
      required?: string[];
    };

    expect(operation?.requestBody).toEqual({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ServicesInquiryBody' },
        },
      },
    });
    expect(Object.keys(operation?.responses ?? {})).toEqual(['200', '400', '503']);
    expect(operation?.responses?.['400']).toMatchObject({
      content: { 'application/json': { schema: { $ref: '#/components/schemas/BackendErrorResponse' } } },
    });
    expect(operation?.responses?.['503']).toMatchObject({
      content: { 'application/json': { schema: { $ref: '#/components/schemas/BackendErrorResponse' } } },
      description: 'Services inquiry submission is temporarily unavailable.',
    });
    expect(requestSchema).toMatchObject({
      additionalProperties: false,
      required: ['email', 'message', 'name', 'service'],
    });
    expect(requestSchema.properties?.service?.enum).toEqual([...SERVICES_INQUIRY_SERVICES]);
    expect(requestSchema.properties?.name?.maxLength).toBe(SERVICES_INQUIRY_FIELD_LIMITS.name);
    expect(requestSchema.properties?.email?.maxLength).toBe(SERVICES_INQUIRY_FIELD_LIMITS.email);
    expect(requestSchema.properties?.bandOrProject?.maxLength).toBe(SERVICES_INQUIRY_FIELD_LIMITS.bandOrProject);
    expect(requestSchema.properties?.serviceDetails?.maxLength).toBe(SERVICES_INQUIRY_FIELD_LIMITS.serviceDetails);
    expect(requestSchema.properties?.message?.maxLength).toBe(SERVICES_INQUIRY_FIELD_LIMITS.message);
    expect(successSchema).toMatchObject({
      additionalProperties: false,
      properties: { status: { enum: ['submitted'] } },
      required: ['status'],
    });
    expect(JSON.stringify(operation?.responses?.['503']).toLowerCase()).not.toMatch(
      /resend|provider[_ -]?id|diagnostic/,
    );
  });
});
