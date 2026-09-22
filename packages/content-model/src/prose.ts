import { toPlainText } from '@portabletext/toolkit';
import { z } from 'zod';

export const cmsLinkSchema = z.string().refine((value) => {
  try {
    return (
      ![...value].some((character) => character <= ' ' || character === '\\') &&
      ['https:', 'http:', 'mailto:'].includes(new URL(value, 'https://content.invalid/').protocol)
    );
  } catch {
    return false;
  }
}, 'Use a safe web, email, or relative link.');

const key = z.string().min(1).max(128);
export const textBlockSchema = z
  .object({
    _type: z.literal('block', {
      error: 'Use text paragraphs, lists, or quotations. Images, code blocks and embeds are not supported here.',
    }),
    _key: key,
    style: z.enum(['normal', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']).optional(),
    textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
    children: z.array(
      z
        .object({ _type: z.literal('span'), _key: key, text: z.string(), marks: z.array(z.string()).optional() })
        .strict(),
    ),
    markDefs: z
      .array(
        z.object({ _type: z.literal('link'), _key: key, href: cmsLinkSchema, blank: z.boolean().optional() }).strict(),
      )
      .optional(),
    listItem: z.enum(['bullet', 'number']).optional(),
    level: z.number().int().min(1).max(10).optional(),
    listId: key.optional(),
    listStart: z.number().int().min(1).optional(),
  })
  .strict()
  .superRefine((block, ctx) => {
    const marks = new Set([
      'em',
      'strong',
      'code',
      'underline',
      'strike-through',
      ...(block.markDefs ?? []).map((mark) => mark._key),
    ]);
    for (const [index, span] of block.children.entries()) {
      if (span.marks?.some((mark) => !marks.has(mark)))
        ctx.addIssue({ code: 'custom', path: ['children', index, 'marks'], message: 'Unknown text mark.' });
    }
  });

export const richTextSchema = z.array(textBlockSchema);
export const proseSchema = z.union([z.string(), richTextSchema], {
  error:
    'Use plain text or formatted paragraphs, lists and quotations with safe links. Images, code blocks and embeds are not supported here.',
});
export type Prose = z.infer<typeof proseSchema>;
export type RichText = z.infer<typeof richTextSchema>;

export function proseText(value: Prose | null | undefined): string {
  return typeof value === 'string' ? value : toPlainText(value ?? []);
}

export const requiredProseSchema = proseSchema.refine((value) => proseText(value).trim().length > 0, 'Enter a value.');

/** Null means an absent native field; [] is an intentional clear. */
export function resolveProse(legacy: Prose | null | undefined, rich?: RichText | null): Prose {
  return rich ?? legacy ?? '';
}

export function proseBlocks(value: Prose | null | undefined): RichText {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return value
    .replaceAll('\r\n', '\n')
    .split('\n\n')
    .map((text, index) => ({
      _type: 'block',
      _key: `legacy-${index}`,
      style: 'normal',
      children: [{ _type: 'span', _key: `text-${index}`, text, marks: [] }],
      markDefs: [],
    }));
}

export const scalarProseFields = {
  artists: ['bio'],
  releases: ['summary'],
  distro: ['summary'],
  news: ['summary'],
  newsletter: ['description', 'note'],
} as const;

/** A read/validation projection only. Never write this back to a revision. */
export function projectProseFields(collection: string, data: Record<string, unknown>): Record<string, unknown> {
  const fields = scalarProseFields[collection as keyof typeof scalarProseFields] ?? [];
  const result = { ...data };
  for (const field of fields) {
    const rich = data[`${field}_rich`];
    if (rich === null || rich === undefined) continue;
    const parsed = richTextSchema.safeParse(rich);
    if (parsed.success) result[field] = proseText(parsed.data);
  }
  return result;
}

/** EmDash keeps separate numbered lists and multi-paragraph quotes in flat blocks. */
export function groupEditorialBlocks<
  T extends {
    _type: string;
    style?: string | undefined;
    listItem?: string | undefined;
    listId?: string | undefined;
    level?: number | undefined;
  },
>(blocks: T[]) {
  const groups: { quote: boolean; value: T[] }[] = [];
  let listId: string | undefined;
  for (const block of blocks) {
    const quote = block._type === 'block' && block.style === 'blockquote';
    const nextListId = block._type === 'block' && block.listItem ? block.listId : undefined;
    const topLevel = block._type !== 'block' || (block.level ?? 1) === 1;
    if (!groups.length || groups.at(-1)!.quote !== quote || (topLevel && listId !== nextListId))
      groups.push({ quote, value: [] });
    groups.at(-1)!.value.push(quote ? { ...block, style: 'normal' } : block);
    if (topLevel) listId = nextListId;
  }
  return groups;
}
