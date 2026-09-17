import { z } from 'zod';

export const inventoryQuerySchema = z
  .object({
    q: z.string().max(200).default(''),
    area: z.enum(['all', 'release', 'distro', 'merch']).default('all'),
    format: z.string().min(1).max(100).optional(),
    cursor: z
      .string()
      .max(2048)
      .refine((value) => {
        try {
          const parts: unknown = JSON.parse(value);
          return Array.isArray(parts) && parts.length === 3 && parts.every((part) => typeof part === 'string');
        } catch {
          return false;
        }
      }, 'Invalid inventory cursor.')
      .optional(),
    limit: z.coerce.number().int().min(1).max(50).default(25),
    before: z.string().datetime().optional(),
  })
  .strict();
