import { toPlainText } from '@portabletext/toolkit';
import type { Prose, RichText } from './prose';

export function isSafeCmsLink(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return (
      ![...value].some((character) => character <= ' ' || character === '\\') &&
      ['https:', 'http:', 'mailto:'].includes(new URL(value, 'https://content.invalid/').protocol)
    );
  } catch {
    return false;
  }
}

export function proseText(value: Prose | null | undefined): string {
  return typeof value === 'string' ? value : toPlainText(value ?? []);
}

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
