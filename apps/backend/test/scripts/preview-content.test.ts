import { describe, expect, it } from 'vitest';
import { previewInputSchema, readBoundedText } from '../../src/cms/preview-content';

describe('private preview input boundary', () => {
  it('rejects forged identities and caller-owned environment', () => {
    const input = { collection: 'news', slug: 'news', data: {} };
    expect(previewInputSchema.safeParse(input).success).toBe(true);
    expect(previewInputSchema.safeParse({ ...input, environment: 'prd' }).success).toBe(false);
    expect(previewInputSchema.safeParse({ ...input, id: '../secret' }).success).toBe(false);
    expect(previewInputSchema.safeParse({ ...input, collection: 'orders' }).success).toBe(false);
  });
  it('caps streamed input even without Content-Length', async () => {
    await expect(readBoundedText(new Response('12345').body, 4)).rejects.toThrow('size limit');
    await expect(readBoundedText(new Response('1234').body, 4)).resolves.toBe('1234');
  });
});
