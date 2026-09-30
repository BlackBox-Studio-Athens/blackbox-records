import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import EditorialPicker from './EditorialPicker';

test('Artist selection stays required by default while optional News can clear it', () => {
  const props = { base: '', collection: 'artists' as const, label: 'Artist', value: '', onSelect: () => {} };
  const required = renderToStaticMarkup(<EditorialPicker {...props} />);
  expect(required).toContain('aria-required="true"');
  expect(required).toMatch(/\srequired=""/);
  const optional = renderToStaticMarkup(<EditorialPicker {...props} required={false} />);
  expect(optional).toContain('aria-required="false"');
  expect(optional).not.toMatch(/\srequired=""/);
  expect(optional).not.toContain('Clear artist');
  const selected = renderToStaticMarkup(
    <EditorialPicker {...props} required={false} value="artist-1" onClear={() => {}} />,
  );
  expect(selected).toContain('Clear artist');
});
