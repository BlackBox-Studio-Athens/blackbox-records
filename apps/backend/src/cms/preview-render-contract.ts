import { z } from 'zod';
import {
  isCmsCollection,
  validateCmsRevisionContent,
  snapshotStoreItemSchema,
  type PublicContent,
} from '@blackbox/content-model';

const image = z.object({
  src: z.string().regex(/^\/_preview\/media\/[a-f0-9-]{36}\/[A-Za-z0-9_-]{1,128}$/),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.enum(['png', 'jpg', 'webp']),
});
export const previewRenderSchema = z
  .object({
    context: z.uuid(),
    generation: z.number().int().nonnegative(),
    parentOrigin: z.url(),
    path: z.string().startsWith('/').max(1024),
    content: z.object({
      records: z
        .array(
          z.object({
            collection: z.string().refine(isCmsCollection),
            id: z.string().min(1).max(128),
            slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
            data: z.record(z.string(), z.json()),
          }),
        )
        .max(1000),
      storeItems: z.array(snapshotStoreItemSchema).max(1000).optional(),
    }),
    images: z.record(z.string(), image),
  })
  .strict();

export function previewRenderContent(input: z.infer<typeof previewRenderSchema>): PublicContent {
  for (const record of input.content.records)
    if (!isCmsCollection(record.collection) || validateCmsRevisionContent(record.collection, record.data).length)
      throw new Error('Incomplete content cannot render.');
  return { ...input.content, media: [] };
}
