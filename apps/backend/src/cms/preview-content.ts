import { z } from 'zod';
import { isCmsCollection } from '@blackbox/content-model';
export const previewPath = '/_emdash/preview';
const identifier = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const previewInputSchema = z
  .object({
    collection: z.string().refine(isCmsCollection),
    id: identifier.optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(200),
    data: z.record(z.string(), z.unknown()),
  })
  .strict();
export type PreviewInput = z.infer<typeof previewInputSchema>;
export async function readBoundedText(body: ReadableStream<Uint8Array> | null, limit: number) {
  if (!body) throw new Error('Empty preview request.');
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) throw new Error('Preview exceeds the size limit.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}
