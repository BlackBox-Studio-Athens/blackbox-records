import type { RichText } from '../../packages/content-model/src/prose';

export const formattedProse: RichText = [
  {
    _type: 'block',
    _key: 'intro',
    style: 'normal',
    textAlign: 'right',
    children: [
      { _type: 'span', _key: 'strong', text: 'Bold description', marks: ['strong'] },
      { _type: 'span', _key: 'line', text: '\nSecond line ', marks: ['em'] },
      { _type: 'span', _key: 'link', text: 'Band website', marks: ['website'] },
    ],
    markDefs: [{ _type: 'link', _key: 'website', href: 'https://example.com/band', blank: true }],
  },
  {
    _type: 'block',
    _key: 'list',
    style: 'normal',
    listItem: 'number',
    level: 1,
    listId: 'first-list',
    listStart: 3,
    children: [{ _type: 'span', _key: 'item', text: 'Third pressing', marks: [] }],
    markDefs: [],
  },
  {
    _type: 'block',
    _key: 'second-list',
    style: 'normal',
    listItem: 'number',
    level: 1,
    listId: 'new-list',
    children: [{ _type: 'span', _key: 'item', text: 'Separate list', marks: [] }],
    markDefs: [],
  },
];
