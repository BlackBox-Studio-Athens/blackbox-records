import { z } from 'astro/zod';

const text = z.string().trim().min(1);
const section = z.object({ summary: text, paragraphs: z.array(text).min(1) }).strict();

export const approvedPurchaseInformationSchema = z
  .object({
    revision: z.iso.date(),
    seller: z.object({ name: text, address: text, support_email: z.email() }).strict(),
    terms: z
      .object({
        dispatch: section,
        delivery: section,
        returns: section,
        damaged_items: section,
        uncollected_parcels: section,
      })
      .strict(),
    privacy: z
      .object({
        purposes: section,
        recipients: section,
        retention: section,
        rights: section,
        contact: section,
      })
      .strict(),
  })
  .strict();

export const purchaseInformationSchema = z.discriminatedUnion('publication', [
  z.object({ publication: z.literal('pending'), content: approvedPurchaseInformationSchema }),
  z.object({
    publication: z.literal('approved'),
    content: approvedPurchaseInformationSchema.refine(
      (content) => !/to be confirmed|example\.invalid/i.test(JSON.stringify(content)),
      'Replace all placeholders with approved public wording before publication.',
    ),
  }),
]);

export type ApprovedPurchaseInformation = z.infer<typeof approvedPurchaseInformationSchema>;
