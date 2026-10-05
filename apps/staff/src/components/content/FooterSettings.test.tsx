import { renderToStaticMarkup } from 'react-dom/server';
import type { ComponentProps } from 'react';
import { expect, test, vi } from 'vitest';
import {
  parseContentSnapshot,
  publishedCollection,
  replacePublishedRecord,
  settingsContentSchema,
  validateCmsDraft,
} from '@blackbox/content-model';
import ContentFields from './ContentFields';
import WebsitePages from './WebsitePages';
import { getContentValidation } from '../publication/content-validation';
import type * as InputModule from '../ui/input';

const controls = vi.hoisted(() => ({
  inputs: [] as Array<ComponentProps<'input'> & { 'data-content-path'?: string }>,
}));
vi.mock('../ui/input', async (importOriginal) => {
  const actual = await importOriginal<typeof InputModule>();
  return {
    ...actual,
    Input: (props: ComponentProps<typeof actual.Input>) => {
      controls.inputs.push(props);
      return <actual.Input {...props} />;
    },
  };
});

const settings = {
  label_name: 'BlackBox Records',
  established_year: 2026,
  url: 'https://example.com',
  logo: '/assets/images/brand/logo.png',
  location: { locality: 'Athens', country: 'Greece' },
};

test('Footer text opens Label details and edits only its optional plain text field', () => {
  const destinations = renderToStaticMarkup(<WebsitePages footer />);
  expect(destinations).toContain('href="/content/?collection=settings"');
  expect(destinations).toContain('Footer text');
  let data: ComponentProps<typeof ContentFields>['data'] = { ...settings };
  controls.inputs = [];
  const markup = renderToStaticMarkup(
    <ContentFields
      collection="settings"
      data={data}
      base=""
      validation={getContentValidation('settings', data)}
      validationAttempt={0}
      onChange={(next) => {
        data = next;
      }}
    />,
  );
  expect(markup).toContain('Leave blank to use the default label description.');
  const input = controls.inputs.find((control) => control['data-content-path'] === 'footer_text')!;
  expect(input.required).toBe(false);
  input.onChange!({ target: { value: 'Independent records from Athens.' } } as Parameters<
    NonNullable<typeof input.onChange>
  >[0]);
  expect(data).toEqual({ ...settings, footer_text: 'Independent records from Athens.' });
  input.onChange!({ target: { value: '' } } as Parameters<NonNullable<typeof input.onChange>>[0]);
  expect(data).toEqual({ ...settings, footer_text: null });
});

test('legacy settings and blank resets stay valid; footer drafts enter only the selected accepted snapshot', () => {
  const record = { collection: 'settings' as const, id: 'label', slug: 'site', revisionId: 'accepted', data: settings };
  const snapshot = { schemaVersion: 1, environment: 'local', records: [record], media: [] };
  for (const footer_text of [undefined, null, '', '   ', 'Independent records from Athens.']) {
    expect(getContentValidation('settings', { ...settings, footer_text }).valid).toBe(true);
    expect(validateCmsDraft('settings', { ...settings, footer_text })).toEqual([]);
    const accepted = parseContentSnapshot(
      JSON.stringify({ ...snapshot, records: [{ ...record, data: { ...settings, footer_text } }] }),
      'local',
    );
    const projected = publishedCollection(accepted, 'settings', '/media')[0]!.data;
    // Native optional columns return null; public projection removes it before the portable schema.
    if (footer_text === null || footer_text === undefined) expect(projected).not.toHaveProperty('footer_text');
    expect(settingsContentSchema.parse(projected).footer_text).toBe(footer_text?.trim());
  }
  for (const footer_text of [1, true, {}, []])
    expect(getContentValidation('settings', { ...settings, footer_text }).byPath.footer_text).toBeDefined();
  const accepted = parseContentSnapshot(JSON.stringify(snapshot), 'local');
  const draft = {
    ...record,
    revisionId: 'footer-draft',
    data: { ...settings, footer_text: 'Independent records from Athens.' },
  };
  expect(publishedCollection(accepted, 'settings', '/media')[0]!.data.footer_text).toBeUndefined();
  const next = replacePublishedRecord(accepted, draft, []);
  expect(publishedCollection(next, 'settings', '/media')[0]!.data.footer_text).toBe(draft.data.footer_text);
  expect(publishedCollection(accepted, 'settings', '/media')[0]!.data.footer_text).toBeUndefined();
});
