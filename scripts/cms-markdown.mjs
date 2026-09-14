import { parseMarkdown } from './inventory-cms-content.mjs';

export function markdownToPortableText(source) {
  // Match Astro's current rendered typography during this one-time migration.
  return markdownTreeToPortableText(parseMarkdown(source, { features: { smartPunctuation: true } }));
}

// The import accepts the constructs found in the source inventory. Unknown nodes
// fail before a write; they must never become an empty or plain-text fallback.
export function markdownTreeToPortableText(tree) {
  let sequence = 0;
  const key = () => `source-${sequence++}`;
  const unsupported = (node) => {
    throw new Error(`Unsupported Markdown construct: ${node.type}`);
  };
  function block(node, list = {}) {
    const result = { _type: 'block', _key: key(), style: 'normal', ...list, children: [], markDefs: [] };
    function inline(child, marks = []) {
      if (child.type === 'text') {
        result.children.push({ _type: 'span', _key: key(), text: child.value, marks });
        return;
      }
      if (child.type === 'emphasis' || child.type === 'strong') {
        for (const nested of child.children) inline(nested, [...marks, child.type === 'emphasis' ? 'em' : 'strong']);
        return;
      }
      if (child.type === 'link' && !child.title) {
        // Existing relative links retain their route-relative meaning after import.
        const url = new URL(child.url, 'https://source.invalid/');
        if (
          !['https:', 'http:', 'mailto:'].includes(url.protocol) ||
          [...child.url].some((character) => character <= ' ' || character === '\\')
        ) {
          throw new Error('Unsafe Markdown link');
        }
        const mark = { _type: 'link', _key: key(), href: child.url };
        result.markDefs.push(mark);
        for (const nested of child.children) inline(nested, [...marks, mark._key]);
        return;
      }
      unsupported(child);
    }
    for (const child of node.children) inline(child);
    return result;
  }
  if (tree.type !== 'root') unsupported(tree);
  const blocks = [];
  for (const node of tree.children) {
    if (node.type === 'paragraph') blocks.push(block(node));
    else if (node.type === 'list') {
      const listId = key();
      for (const item of node.children) {
        if (
          item.type !== 'listItem' ||
          (item.checked !== null && item.checked !== undefined) ||
          item.children.length !== 1 ||
          item.children[0].type !== 'paragraph'
        ) {
          unsupported(item);
        }
        blocks.push(
          block(item.children[0], {
            listItem: node.ordered ? 'number' : 'bullet',
            level: 1,
            ...(node.ordered ? { listId, listStart: node.start ?? 1 } : {}),
          }),
        );
      }
    } else unsupported(node);
  }
  return blocks;
}
