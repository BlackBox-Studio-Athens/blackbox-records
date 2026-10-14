import { z } from 'zod';
import { isHttpsUrl } from './validation';

const text = z.string().trim().min(1).max(4000);
const electronicAddress = z.union([
  z.email(),
  z.string().max(2000).refine(isHttpsUrl, 'Use an email or HTTPS contact page.'),
]);
const contact = z.object({ name: text, postal_address: text, electronic_address: electronicAddress }).strict();
const manufacturer = contact.extend({ establishment: z.enum(['eu', 'non_eu']) });
const responsiblePerson = contact.extend({
  eu_country: z.enum([
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
  ]),
});
const safetyInformation = z.object({ status: z.enum(['provided', 'not_required']), text_el: text.optional() }).strict();
const offer = z.object({
  product_type: text,
  product_identifier: text,
  manufacturer,
  responsible_person: responsiblePerson.optional(),
  safety_information: safetyInformation,
});

function checkOffer(data: z.infer<typeof offer>, context: z.RefinementCtx) {
  if (data.manufacturer.establishment === 'non_eu' && !data.responsible_person)
    context.addIssue({
      code: 'custom',
      path: ['responsible_person'],
      message: 'Verify the EU responsible person and their contacts.',
    });
  if (data.safety_information.status === 'provided' && !data.safety_information.text_el)
    context.addIssue({
      code: 'custom',
      path: ['safety_information', 'text_el'],
      message: 'Provide the applicable warnings and safety instructions in Greek.',
    });
  if (data.safety_information.status === 'not_required' && data.safety_information.text_el)
    context.addIssue({
      code: 'custom',
      path: ['safety_information', 'status'],
      message: 'Choose Provided when safety information is recorded.',
    });
}

/** Renderer contract. Evidence and internal review details are deliberately absent. */
export const productSafetyOfferSchema = offer.superRefine(checkOffer);
const evidence = z.object({ reference: text, checked_on: z.iso.date(), notes: text }).strict();
const operatorRole = z.enum(['manufacturer', 'importer', 'distributor']);
const verifiedProductSafetySchema = z
  .object({
    ...offer.shape,
    review_status: z.literal('verified'),
    operator_role: operatorRole,
    evidence,
    first_placed_on_eu_market: z.iso.date().optional(),
  })
  .strict()
  .superRefine(checkOffer);

/** Private incomplete work is retained; claiming verification requires the complete offer and evidence. */
export const productSafetyContentSchema = z
  .object({
    product_type: text.optional(),
    product_identifier: text.optional(),
    manufacturer: manufacturer.partial().optional(),
    responsible_person: responsiblePerson.partial().optional(),
    safety_information: safetyInformation.partial().optional(),
    review_status: z.enum(['incomplete', 'verified']).optional(),
    operator_role: operatorRole.optional(),
    evidence: evidence.partial().optional(),
    first_placed_on_eu_market: z.iso.date().optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if (data.review_status !== 'verified') return;
    const result = verifiedProductSafetySchema.safeParse(data);
    if (!result.success)
      for (const issue of result.error.issues)
        context.addIssue({ code: 'custom', path: issue.path, message: issue.message });
  });

/** Readiness only: callers must not silently activate a catalogue-wide sale gate. */
export function getProductSafetyIssues(value: unknown) {
  const result = verifiedProductSafetySchema.safeParse(value);
  return result.success
    ? []
    : result.error.issues.map((issue) => ({
        path: ['product_safety', ...issue.path.map((part) => (typeof part === 'number' ? part : String(part)))],
        message: issue.message,
      }));
}

export function productSafetyOfferInformation(value: unknown) {
  const result = verifiedProductSafetySchema.safeParse(value);
  return result.success ? productSafetyOfferSchema.parse(result.data) : undefined;
}
