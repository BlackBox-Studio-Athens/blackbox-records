import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inventory, parseMarkdown } from './inventory-cms-content.mjs';
import { markdownTreeToPortableText } from './cms-markdown.mjs';

test('all inventoried bodies preserve text, emphasis, link destinations, list starts and deterministic identities', async () => {
  for (const record of (await inventory()).records.filter((entry) => entry.body.trim())) {
    const tree = parseMarkdown(record.body);
    const expectedText = [];
    const expectedLinks = [];
    function visit(node) {
      if (node.type === 'text') expectedText.push(node.value);
      if (node.type === 'link') expectedLinks.push(node.url);
      for (const child of node.children ?? []) visit(child);
    }
    visit(tree);
    const blocks = markdownTreeToPortableText(tree);
    assert.deepEqual(markdownTreeToPortableText(tree), blocks);
    assert.deepEqual(
      blocks.flatMap((block) => block.children.map((span) => span.text)),
      expectedText,
    );
    assert.deepEqual(
      blocks.flatMap((block) => block.markDefs.map((mark) => mark.href)),
      expectedLinks,
    );
    assert.equal(blocks.filter((block) => block.listItem).length, record.markdown.listItem ?? 0);
  }
  const blocks = markdownTreeToPortableText(parseMarkdown('_Text_ **bold** [link](../item/)\n\n3. Three\n4. Four'));
  assert.deepEqual(blocks[0].children[0].marks, ['em']);
  assert.ok(blocks[0].children.some((span) => span.marks.includes('strong')));
  assert.equal(blocks[1].listStart, 3);
  assert.equal(blocks[1].listId, blocks[2].listId);
});

test('unsupported or unsafe Markdown fails instead of losing content', () => {
  for (const source of [
    '<iframe src="https://example.com"></iframe>',
    '![image](photo.jpg)',
    '# Heading',
    '```js\ncode\n```',
    '- [x] task',
    '- item\n  - nested',
    '[bad](javascript:alert%281%29)',
    '[title](https://example.com "title")',
  ]) {
    assert.throws(() => markdownTreeToPortableText(parseMarkdown(source)), /Unsupported|Unsafe/);
  }
});
