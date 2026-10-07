import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import ContentFields from './ContentFields';
import type { ComponentProps } from 'react';
import type * as InputModule from '../ui/input';
import type * as ButtonModule from '../ui/button';
import { getContentValidation } from '../publication/content-validation';

const controls = vi.hoisted(() => ({
  inputs: [] as Array<ComponentProps<'input'> & { 'data-content-path'?: string }>,
  buttons: [] as Array<ComponentProps<'button'>>,
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
vi.mock('../ui/button', async (importOriginal) => {
  const actual = await importOriginal<typeof ButtonModule>();
  return {
    ...actual,
    Button: (props: ComponentProps<typeof actual.Button>) => {
      controls.buttons.push(props);
      return <actual.Button {...props} />;
    },
  };
});

test('partner rows add, edit, reorder and remove without replacing other release fields', () => {
  let data: ComponentProps<typeof ContentFields>['data'] = { title: 'Record', singles: [] };
  let validationAttempt = 0;
  const render = () => {
    controls.inputs = [];
    controls.buttons = [];
    return renderToStaticMarkup(
      <ContentFields
        collection="releases"
        data={data}
        base=""
        validation={getContentValidation('releases', data)}
        validationAttempt={validationAttempt}
        onChange={(next) => {
          data = next;
        }}
      />,
    );
  };
  const initial = render();
  expect(data).toEqual({ title: 'Record', singles: [] });
  expect(initial.indexOf('Singles')).toBeLessThan(initial.indexOf('Partner store links'));
  expect(initial.indexOf('Partner store links')).toBeLessThan(initial.indexOf('Clips'));
  // SSR captures the real controlled-form callbacks; the browser acceptance checks keyboard use.
  const click = (label: string, index = 0) => {
    const buttons = controls.buttons.filter((button) =>
      (Array.isArray(button.children) ? button.children : [button.children]).includes(label),
    );
    const handler = buttons[index]?.onClick;
    expect(handler).toBeDefined();
    expect(buttons[index]?.disabled).not.toBe(true);
    handler!({} as Parameters<NonNullable<typeof handler>>[0]);
  };
  // Photos and Singles precede the partner row control.
  click('Add row', 2);
  expect(data.partner_links).toEqual([{ label: '', url: '' }]);
  expect(render()).not.toContain('id="content-partner_links.0.label-error"');
  validationAttempt = 1;
  const markup = render();
  expect(markup).toContain('Store name');
  expect(markup).toContain('Store link');
  const validation = getContentValidation('releases', data);
  expect(validation.byPath['partner_links.0.label']).toEqual(['Enter a value.']);
  expect(validation.byPath['partner_links.0.url']).toBeDefined();
  expect(markup).toContain(validation.byPath['partner_links.0.label']![0]);
  expect(markup).toContain(validation.byPath['partner_links.0.url']![0]);
  expect(markup).toContain('aria-invalid="true"');
  for (const [key, value] of [
    ['label', 'Partner shop'],
    ['url', 'https://example.com/record'],
  ]) {
    controls.inputs.find((input) => input['data-content-path'] === `partner_links.0.${key}`)!.onChange!({
      target: { value },
    } as Parameters<NonNullable<ComponentProps<'input'>['onChange']>>[0]);
    render();
  }
  expect(data.partner_links).toEqual([{ label: 'Partner shop', url: 'https://example.com/record' }]);
  expect(getContentValidation('releases', data).issues.filter((issue) => issue.path[0] === 'partner_links')).toEqual(
    [],
  );
  click('Add row', 2);
  render();
  for (const [key, value] of [
    ['label', 'Second shop'],
    ['url', 'https://example.org/record'],
  ]) {
    controls.inputs.find((input) => input['data-content-path'] === `partner_links.1.${key}`)!.onChange!({
      target: { value },
    } as Parameters<NonNullable<ComponentProps<'input'>['onChange']>>[0]);
    render();
  }
  const rows = data.partner_links as Array<{ label: string; url: string }>;
  expect(
    controls.buttons.filter((button) => Array.isArray(button.children) && button.children.includes('Move down')).at(-1)
      ?.disabled,
  ).toBe(true);
  click('Move up', 1);
  expect(data.partner_links).toEqual([rows[1], rows[0]]);
  render();
  click('Move down');
  expect(data.partner_links).toEqual(rows);
  render();
  click('Remove row ', 0);
  expect(data.partner_links).toEqual([rows[1]]);
  render();
  click('Remove row ');
  expect(data.partner_links).toEqual([]);
  expect(data.title).toBe('Record');
  expect(data.singles).toEqual([]);
});

test('Releases order stays optional, validates positive whole numbers and edits only the draft field', () => {
  let data: ComponentProps<typeof ContentFields>['data'] = { title: 'Record', release_stage: 'upcoming' };
  const render = () => {
    controls.inputs = [];
    return renderToStaticMarkup(
      <ContentFields
        collection="releases"
        data={data}
        base=""
        validation={getContentValidation('releases', data)}
        validationAttempt={0}
        onChange={(next) => {
          data = next;
        }}
      />,
    );
  };
  const html = render();
  expect(html).toContain('Releases order');
  // Release stage describes the music only; physical copies belong to Selling.
  expect(html).toContain(
    'Upcoming means the music is not out yet. Physical copies are managed in Selling: pre-order, stock and the zero-stock state.',
  );
  expect(data.releases_priority).toBeUndefined();
  const field = () => controls.inputs.find((input) => input['data-content-path'] === 'releases_priority')!;
  expect(field().required).toBe(false);
  expect(field().min).toBe(1);
  for (const value of ['2', '0', '-1', '1.5', '']) {
    field().onChange!({ target: { value } } as Parameters<NonNullable<ComponentProps<'input'>['onChange']>>[0]);
    render();
    expect(getContentValidation('releases', data).issues.some((issue) => issue.path[0] === 'releases_priority')).toBe(
      !['2', ''].includes(value),
    );
    expect(data.title).toBe('Record');
    expect(data.release_stage).toBe('upcoming');
  }
  expect(data.releases_priority).toBeNull();
});

test.each(['http://example.com/record', '/record', 'javascript:alert(1)'])(
  'partner store link errors stay associated with their field for %s',
  (url) => {
    const data = { partner_links: [{ label: 'Partner shop', url }] };
    const validation = getContentValidation('releases', data);
    const markup = renderToStaticMarkup(
      <ContentFields
        collection="releases"
        data={data}
        base=""
        validation={validation}
        validationAttempt={1}
        onChange={() => {}}
      />,
    );
    expect(validation.byPath['partner_links.0.url']).toBeDefined();
    expect(markup).toMatch(
      /id="content-partner_links\.0\.url"[^>]*aria-invalid="true"[^>]*aria-describedby="content-partner_links\.0\.url-error"/,
    );
    expect(markup).toContain('id="content-partner_links.0.url-error"');
  },
);

test.each([undefined, null, true, 1])(
  'Artist activity defaults active for %s without changing content',
  (is_active) => {
    const onChange = vi.fn();
    const markup = renderToStaticMarkup(
      <ContentFields
        collection="artists"
        data={{ title: 'Artist', is_active }}
        base=""
        validation={{ valid: true, issues: [], byPath: {} }}
        validationAttempt={0}
        onChange={onChange}
      />,
    );
    const input = /<input(?=[^>]*id="content-is_active")[^>]*>/.exec(markup)?.[0];
    expect(input).toContain('role="switch"');
    expect(input).toContain('checked=""');
    expect(input).toContain('aria-labelledby="content-is_active-label"');
    expect(markup.indexOf('Artist name')).toBeLessThan(markup.indexOf('Active artist'));
    expect(markup).toContain('Inactive artists appear last on the website after you publish changes.');
    expect(onChange).not.toHaveBeenCalled();
  },
);

test.each([false, 0])('Artist activity remains inactive for %s', (is_active) => {
  const markup = renderToStaticMarkup(
    <ContentFields
      collection="artists"
      data={{ title: 'Artist', is_active }}
      base=""
      validation={{ valid: true, issues: [], byPath: {} }}
      validationAttempt={0}
      onChange={() => {}}
    />,
  );
  const input = /<input(?=[^>]*id="content-is_active")[^>]*>/.exec(markup)?.[0];
  expect(input).not.toContain('checked=""');
  expect(markup).toMatch(/>Inactive<\/span>/);
});

test('Artist activity follows the form disabled state', () => {
  const markup = renderToStaticMarkup(
    <ContentFields
      collection="artists"
      data={{ title: 'Artist' }}
      base=""
      validation={{ valid: true, issues: [], byPath: {} }}
      validationAttempt={0}
      disabled
      onChange={() => {}}
    />,
  );
  expect(/<input(?=[^>]*id="content-is_active")[^>]*>/.exec(markup)?.[0]).toContain('disabled=""');
});
