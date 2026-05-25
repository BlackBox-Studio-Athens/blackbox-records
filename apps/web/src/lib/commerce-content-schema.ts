import { z } from 'astro/zod';

export const commercePublishTargetValues = ['draft', 'uat', 'uat_and_production'] as const;
export const commerceCurrencyValues = ['EUR'] as const;

export const commerceFields = z
  .object({
    enabled: z.boolean().default(false),
    publish_target: z.enum(commercePublishTargetValues).default('draft'),
    price: z
      .object({
        amount_minor: z.number().int().positive(),
        currency: z.enum(commerceCurrencyValues).default('EUR'),
        revision: z.string().trim().min(1).optional(),
      })
      .optional(),
    option_label: z.string().trim().min(1).optional(),
    tax_code: z.string().trim().min(1).default('txcd_99999999'),
    stock: z
      .object({
        initial_online_quantity: z.number().int().nonnegative().optional(),
      })
      .optional(),
    smoke_candidate: z.boolean().default(false),
    retired: z.boolean().default(false),
  })
  .default({
    enabled: false,
    publish_target: 'draft',
    tax_code: 'txcd_99999999',
    smoke_candidate: false,
    retired: false,
  });
