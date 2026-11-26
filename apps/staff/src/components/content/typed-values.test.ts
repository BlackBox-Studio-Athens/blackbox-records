import { proseBlocks, validateCmsContent, validateCmsDraft } from '@blackbox/content-model';
import { expect, test } from 'vitest';
import { editorialWriteData } from '../../lib/backend/editorial-api';
import { editorData } from './typed-values';

test('Staff can save a newly created Distro draft with an empty legacy group', () => {
  const summary_rich = proseBlocks('Vinyl edition.');
  const draft = {
    title: 'Resurrection',
    group: '',
    artist_or_label: 'Bruce.',
    image: { provider: 'local', id: 'cover', width: 1200, height: 1200 },
    image_alt: 'Front cover',
    summary: '',
    summary_rich,
    format: 'Vinyl 12-inch',
    order: 0,
    product_condition: 'new',
  };

  const data = editorialWriteData(editorData('distro', draft));

  expect(validateCmsDraft('distro', data)).toEqual([]);
  expect(data).toEqual({ ...draft, group: '', image: { id: 'cover' } });
  expect(validateCmsContent('distro', data)).toEqual([]);
});

test('draft validation accepts only a cleared legacy group for Distro', () => {
  expect(validateCmsDraft('distro', { group: null })).toEqual([]);
  expect(validateCmsDraft('distro', { group: '' })).toEqual([]);
  expect(validateCmsDraft('distro', { group: 'CDs' })).toContain(': Unrecognized key: "group"');
  expect(validateCmsDraft('distro', { group: null, extra: null })).toContain(': Unrecognized key: "extra"');
  expect(validateCmsDraft('releases', { group: null })).toContain(': Unrecognized key: "group"');
});
