import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import ContentFields from './ContentFields';
import type { ComponentProps } from 'react';
import type * as InputModule from '../ui/input';
import type * as ButtonModule from '../ui/button';
import type * as NativeSelectModule from '../ui/native-select';
import type * as SegmentedChoiceModule from '../fields/SegmentedChoice';
import { getContentValidation } from '../publication/content-validation';

const controls = vi.hoisted(() => ({
  inputs: [] as Array<ComponentProps<'input'> & { 'data-content-path'?: string }>,
  buttons: [] as Array<ComponentProps<'button'>>,
  selects: [] as Array<ComponentProps<(typeof NativeSelectModule)['NativeSelect']> & { 'data-content-path'?: string }>,
  segments: [] as Array<{ label: string; path?: string; value?: string; onChange(value: string): void }>,
}));
vi.mock('../fields/SegmentedChoice', async (importOriginal) => {
  const Actual = (await importOriginal<typeof SegmentedChoiceModule>()).default;
  return {
    default: (props: (typeof controls.segments)[number]) => {
      controls.segments.push(props);
      return <Actual {...(props as React.ComponentProps<typeof Actual>)} />;
    },
  };
});
vi.mock('../ui/native-select', async (importOriginal) => {
  const actual = await importOriginal<typeof NativeSelectModule>();
  return {
    ...actual,
    NativeSelect: (props: ComponentProps<typeof actual.NativeSelect>) => {
      controls.selects.push(props);
      return <actual.NativeSelect {...props} />;
    },
  };
});
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
  // The editor is the ordered card stack, one exclusive group.
  expect([...initial.matchAll(/data-editor-card="(\w+)"/g)].map((match) => match[1])).toEqual([
    'basics',
    'artwork',
    'formats',
    'listening',
    'tracklist',
    'credits',
    'text',
    'home',
    'safety',
  ]);
  expect(initial).toMatch(/<details[^>]*name="release-new"/);
  expect(initial.indexOf('Singles')).toBeLessThan(initial.indexOf('Clips'));
  expect(initial.indexOf('Clips')).toBeLessThan(initial.indexOf('Partner store links'));
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
  // Photos, Singles and Clips precede the partner row control.
  click('Add row', 3);
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
  click('Add row', 3);
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

test('Releases order is automatic until staff fix a position, and edits only the draft field', () => {
  let data: ComponentProps<typeof ContentFields>['data'] = { title: 'Record', release_stage: 'upcoming' };
  const render = () => {
    controls.inputs = [];
    controls.segments = [];
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
  expect(html).toContain('Not on Home · automatic order');
  // Release stage describes the music only; physical copies belong to Selling.
  expect(html).toContain('Upcoming means the music is not out yet. Physical copies are managed in Selling.');
  const segment = (label: string) => controls.segments.find((props) => props.label === label)!;
  expect(segment('Release stage').value).toBe('upcoming');
  expect(segment('Order').value).toBe('automatic');
  expect(controls.inputs.find((input) => input['data-content-path'] === 'releases_priority')).toBeUndefined();
  segment('Order').onChange('fixed');
  expect(data.releases_priority).toBe(1);
  expect(render()).toContain('Not on Home · order 1');
  expect(controls.inputs.find((input) => input['data-content-path'] === 'releases_priority')).toBeDefined();
  segment('Order').onChange('automatic');
  expect(data.releases_priority).toBeNull();
  expect(data.title).toBe('Record');
  expect(data.release_stage).toBe('upcoming');
});

test('Catalog number takes digits only behind a fixed BBR# prefix and stores the canonical number', () => {
  let data: ComponentProps<typeof ContentFields>['data'] = { title: 'Record' };
  const render = () => {
    controls.inputs = [];
    return renderToStaticMarkup(
      <ContentFields
        collection="releases"
        data={data}
        base=""
        recordId="release-1"
        validation={getContentValidation('releases', data)}
        validationAttempt={0}
        onChange={(next) => {
          data = next;
        }}
      />,
    );
  };
  const html = render();
  expect(html.indexOf('Catalog number')).toBeLessThan(html.indexOf('Release stage'));
  expect(html).toContain('BBR#');
  const field = () => controls.inputs.find((input) => input['data-content-path'] === 'catalog_number')!;
  expect(field()['aria-required']).toBe(true);
  expect(field().inputMode).toBe('numeric');
  for (const [typed, shown, stored, valid] of [
    ['bbr #4', '004', 'BBR#004', true],
    ['12', '012', 'BBR#012', true],
    ['1000', '1000', 'BBR#1000', true],
    ['0', '0', 'BBR#0', false],
    ['000', '000', 'BBR#000', false],
    ['', '', '', false],
  ] as const) {
    field().onChange!({ target: { value: typed } } as Parameters<NonNullable<ComponentProps<'input'>['onChange']>>[0]);
    render();
    expect(data.catalog_number).toBe(stored);
    // A fresh mount shows the stored number's digits, padded once it is valid.
    expect(String(field().value)).toBe(shown);
    // Publication needs a real number; an emptied field reads as missing like other required fields.
    expect(getContentValidation('releases', data).byPath.catalog_number === undefined).toBe(valid);
    expect(data.title).toBe('Record');
  }
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
      /id="content-partner_links\.0\.url"[^>]*aria-invalid="true"[^>]*aria-describedby="content-partner_links\.0\.url-status content-partner_links\.0\.url-error"/,
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

const safetyComplete = {
  product_type: '12-inch vinyl LP',
  product_identifier: 'BBX-014',
  operator_role: 'manufacturer',
  manufacturer: {
    name: 'Example Records',
    postal_address: '1 Example Street, 10000 Athens, Greece',
    electronic_address: 'safety@example.com',
    establishment: 'eu',
  },
  safety_information: { status: 'not_required' },
  evidence: {
    reference: 'Invoice 2026-031',
    checked_on: '2026-10-01',
    notes: 'Checked the invoice and supplier sheet.',
  },
};

function renderSafety(
  collection: 'releases' | 'distro',
  initial: Record<string, unknown>,
  validationAttempt = 0,
): { markup: string; data: () => Record<string, unknown>; render: () => string } {
  let data = initial;
  const render = () => {
    controls.inputs = [];
    controls.buttons = [];
    return renderToStaticMarkup(
      <ContentFields
        collection={collection}
        data={data}
        base=""
        validation={getContentValidation(collection, data)}
        validationAttempt={validationAttempt}
        onChange={(next) => {
          data = next;
        }}
      />,
    );
  };
  return { markup: render(), data: () => data, render };
}
const safetyInput = (path: string) =>
  controls.inputs.find((input) => input['data-content-path'] === `product_safety.${path}`)!;
const verifyButton = () =>
  controls.buttons.find(
    (button) => Array.isArray(button.children) && button.children.includes('Mark details verified'),
  );
const typeInto = (path: string, value: string) =>
  safetyInput(path).onChange!({ target: { value } } as Parameters<NonNullable<ComponentProps<'input'>['onChange']>>[0]);

test.each(['releases', 'distro'] as const)(
  '%s editor shows a closed Product safety group without changing an untouched record',
  (collection) => {
    const record = { title: 'Record' };
    const { markup, data } = renderSafety(collection, record);
    expect(data()).toBe(record);
    // Releases keep Product safety in a closed card; Distro keeps its closed group.
    expect(markup).toMatch(/<details(?![^>]*\sopen=)[^>]*>(?:(?!<\/details>)[\s\S])*Product safety/);
    expect(markup).toContain('Fill this in from the paperwork for this exact edition.');
    expect(markup).toContain('11 details missing before this can be verified.');
    expect(markup).toContain('Available once every required field above is filled.');
    expect(verifyButton()?.disabled).toBe(true);
    expect(markup).toMatch(
      /id="content-product_safety\.product_identifier"[^>]*aria-describedby="content-product_safety\.product_identifier-hint"/,
    );
    expect(markup).toContain('usually the catalogue number on the spine or centre label');
    expect(markup).toContain('lang="el"');
    expect(markup).not.toContain('EU contact person');
    expect(markup).not.toContain('Enter the catalogue number printed on this edition');
  },
);

test('a verified claim with missing details opens the group with mapped field messages', () => {
  const record = { title: 'Record', product_safety: { review_status: 'verified', product_type: 'Cassette' } };
  const validation = getContentValidation('releases', record);
  expect(validation.byPath['product_safety.product_identifier']).toBeDefined();
  const { markup } = renderSafety('releases', record, 1);
  // The card reports the problem; Publish opens it at the first invalid field.
  expect(markup).toMatch(/data-editor-card="safety" data-state="problem"/);
  expect(markup).toContain('Enter the catalogue number printed on this edition, e.g. BBX-014.');
  expect(markup).toContain('Enter the manufacturer&#x27;s name.');
  expect(markup).toContain('Say where the proof is kept.');
  expect(markup.slice(markup.indexOf('Product safety'))).not.toContain('expected');
  expect(markup).toMatch(
    /id="content-product_safety\.product_identifier"[^>]*aria-invalid="true"[^>]*aria-describedby="content-product_safety\.product_identifier-hint content-product_safety\.product_identifier-error"/,
  );
  expect(markup).not.toContain('Choose what the product is');
});

test('Mark details verified is available only for complete details and writes only the review status', () => {
  const almost = renderSafety('distro', {
    title: 'Item',
    product_safety: { ...safetyComplete, evidence: { ...safetyComplete.evidence, notes: undefined } },
  });
  expect(almost.markup).toContain('1 detail missing before this can be verified.');
  expect(verifyButton()?.disabled).toBe(true);
  const ready = renderSafety('distro', { title: 'Item', product_safety: safetyComplete });
  expect(ready.markup).not.toContain('missing before this can be verified');
  expect(verifyButton()?.disabled).not.toBe(true);
  verifyButton()!.onClick!({} as Parameters<NonNullable<ComponentProps<'button'>['onClick']>>[0]);
  expect(ready.data()).toEqual({ title: 'Item', product_safety: { ...safetyComplete, review_status: 'verified' } });
  expect(ready.render()).toMatch(/data-editor-card="safety"[\s\S]*?>Verified</);
  expect(verifyButton()).toBeUndefined();
});

test('a manufacturer outside the EU reveals the EU contact person fields', () => {
  const { markup } = renderSafety('releases', {
    product_safety: { manufacturer: { establishment: 'non_eu' } },
  });
  expect(markup).toContain('EU contact person');
  expect(markup).toContain('The company in the EU responsible for this product.');
  expect(markup).toContain('id="content-product_safety.responsible_person.eu_country"');
  expect(markup).toContain('<option value="GR">Greece</option>');
});

test('editing verified product details resets review and empty inputs remove the value', () => {
  const { data, render } = renderSafety('releases', {
    title: 'Record',
    product_safety: { ...safetyComplete, review_status: 'verified', first_placed_on_eu_market: '2026-01-05' },
  });
  typeInto('product_identifier', 'BBX-014 · 2nd press 2026');
  expect(data().product_safety).toEqual({
    ...safetyComplete,
    product_identifier: 'BBX-014 · 2nd press 2026',
    review_status: 'incomplete',
    first_placed_on_eu_market: '2026-01-05',
  });
  render();
  expect(verifyButton()?.disabled).not.toBe(true);
  typeInto('evidence.reference', '');
  expect((data().product_safety as typeof safetyComplete).evidence).not.toHaveProperty('reference');
  render();
  typeInto('manufacturer.name', '');
  expect((data().product_safety as typeof safetyComplete).manufacturer).not.toHaveProperty('name');
  expect(data().title).toBe('Record');
});

function renderCondition(collection: 'releases' | 'distro', initial: Record<string, unknown>, validationAttempt = 0) {
  let data = initial;
  const render = () => {
    controls.selects = [];
    controls.segments = [];
    return renderToStaticMarkup(
      <ContentFields
        collection={collection}
        data={data}
        base=""
        validation={getContentValidation(collection, data)}
        validationAttempt={validationAttempt}
        onChange={(next) => {
          data = next;
        }}
      />,
    );
  };
  const markup = render();
  const select = () => controls.selects.find((props) => props['data-content-path'] === 'product_condition')!;
  const segment = () => controls.segments.find((props) => props.path === 'product_condition')!;
  const choose = (value: string) =>
    select().onChange!({ target: { value } } as Parameters<NonNullable<ComponentProps<'select'>['onChange']>>[0]);
  return { markup, data: () => data, select, segment, choose, render };
}
const conditionError = 'Choose New or Used for this physical product before publishing.';

test.each([
  ['releases', { title: 'Record', formats: ['Vinyl 12-inch'] }],
  ['distro', { title: 'Tape', group: 'Tapes' }],
] as const)('%s physical condition starts unchosen, required, and never defaults to New', (collection, record) => {
  const view = renderCondition(collection, record);
  expect(view.segment()).toMatchObject({ label: 'Physical condition', value: undefined });
  expect(view.data()).toEqual(record);
  // The publication error appears only after a publish attempt, beside the condition choice.
  expect(view.markup).not.toContain(conditionError);
  expect(renderCondition(collection, record, 1).markup).toContain(conditionError);
  view.render();
  view.segment().onChange('used');
  // The choice changes only product_condition.
  expect(view.data()).toEqual({ ...record, product_condition: 'used' });
});

test.each(['new', 'used'] as const)('existing %s condition stays selected and publishable', (condition) => {
  for (const collection of ['releases', 'distro'] as const) {
    const record = { title: 'Record', formats: ['Cassette'], group: 'Tapes', product_condition: condition };
    const view = renderCondition(collection, record, 1);
    expect(view.segment().value).toBe(condition);
    expect(view.markup).not.toContain(conditionError);
    expect(view.data()).toEqual(record);
  }
});

test.each([[[]], [['Digital']], [[' digital ', '']]])(
  'digital-only or editorial releases keep condition optional (%j)',
  (formats) => {
    const { markup, segment } = renderCondition('releases', { title: 'Record', formats }, 1);
    expect(segment().label).toBe('Physical condition (optional)');
    expect(markup).not.toContain(conditionError);
  },
);

test('a release offers a named Show on Home switch that is off until staff turn it on', () => {
  const switchOf = (record: Record<string, unknown>) =>
    /<input[^>]*data-content-path="show_on_home"[^>]*>/.exec(renderCondition('releases', record).markup)?.[0];
  const off = switchOf({ title: 'Record' });
  expect(off).toContain('role="switch"');
  expect(off).toContain('aria-labelledby="content-show_on_home-label"');
  expect(off).not.toContain('checked');
  expect(switchOf({ title: 'Record', show_on_home: true })).toContain('checked');
  expect(switchOf({ title: 'Record', show_on_home: 1 })).toContain('checked');
  expect(switchOf({ title: 'Record', show_on_home: 0 })).not.toContain('checked');
  expect(renderCondition('distro', { title: 'Tape', group: 'Tapes' }).markup).not.toContain('Show on Home');
});

test('an open pre-order shows the Show on Home switch on and locked, with the explanation', () => {
  const data = { title: 'Record' };
  const markup = renderToStaticMarkup(
    <ContentFields
      collection="releases"
      data={data}
      base=""
      openPreorder
      validation={getContentValidation('releases', data)}
      validationAttempt={0}
      onChange={() => {}}
    />,
  );
  const control = /<input[^>]*data-content-path="show_on_home"[^>]*>/.exec(markup)?.[0];
  expect(control).toContain('checked');
  expect(control).toContain('disabled');
  expect(markup).toContain('so Home shows it automatically');
});

test('the Show form edits structured fields and reports missing facts', () => {
  let data: ComponentProps<typeof ContentFields>['data'] = { title: 'BlackBox Showcase Vol. II', lineup: [] };
  const render = (validationAttempt = 0) => {
    controls.inputs = [];
    controls.buttons = [];
    return renderToStaticMarkup(
      <ContentFields
        collection="shows"
        data={data}
        base=""
        validation={getContentValidation('shows', data)}
        validationAttempt={validationAttempt}
        onChange={(next) => {
          data = next;
        }}
      />,
    );
  };
  const markup = render(1);
  // The editor is the ordered card stack, one exclusive group.
  const titles = [...markup.matchAll(/data-editor-card="(\w+)"/g)].map((match) => match[1]);
  expect(titles).toEqual(['title', 'when', 'where', 'tickets', 'lineup', 'poster', 'links']);
  expect(markup).toMatch(/<details[^>]*name="show-new"/);
  for (const label of [
    'Show date',
    'Doors open',
    '24-hour time',
    'Venue',
    'Ticket prices',
    'Ticket link',
    'Facebook event',
  ])
    expect(markup).toContain(label);
  expect(markup).toContain('Date missing');
  expect(markup).toMatch(/data-editor-card="title" data-state="done"/);
  expect(markup).toMatch(/data-editor-card="when" data-state="missing"/);
  // Review reports the facts a title-only draft still lacks.
  const issues = getContentValidation('shows', data).byPath;
  for (const path of ['date', 'doors', 'venue', 'ticket_url', 'lineup']) expect(issues[path]).toBeDefined();
  const input = (path: string) => controls.inputs.find((props) => props['data-content-path'] === path)!;
  input('doors').onChange!({ target: { value: '20' } } as never);
  expect(data.doors).toBe('20:00');
  render();
  input('ticket_url').onChange!({ target: { value: 'www.more.com/gr-el/tickets/music/offer/sidus/' } } as never);
  expect(data.ticket_url).toBe('https://www.more.com/gr-el/tickets/music/offer/sidus/');
  render();
  input('facebook_url').onChange!({ target: { value: 'https://www.instagram.com/blackbox' } } as never);
  expect(data.facebook_url).toBeUndefined();
  expect(data.doors).toBe('20:00');

  data = { ...data, date: '2026-12-05', prices: [1000, 1200, 1500] };
  const filled = render();
  expect(filled).toContain('Sat 05 Dec 2026 · doors 20:00');
  expect(filled).toContain('€10 / €12 / €15 · More.com');
  expect(filled).toContain('Remove €12');
});

function renderSection(
  collection: ComponentProps<typeof ContentFields>['collection'],
  initial: Record<string, unknown>,
) {
  let data = initial;
  const render = () => {
    controls.inputs = [];
    controls.selects = [];
    controls.buttons = [];
    return renderToStaticMarkup(
      <ContentFields
        collection={collection}
        data={data}
        base=""
        validation={getContentValidation(collection, data)}
        validationAttempt={0}
        onChange={(next) => {
          data = next;
        }}
      />,
    );
  };
  return { markup: render(), data: () => data, render };
}

test('a social link reads a stored # as hidden and stores the visible flag instead', () => {
  const view = renderSection('socials', { title: 'Bandcamp', url: '#', order: 3 });
  expect(view.markup).toContain('Hidden on the website');
  const toggle = /<input[^>]*data-content-path="visible"[^>]*>/.exec(view.markup)?.[0];
  expect(toggle).toContain('role="switch"');
  expect(toggle).not.toContain('checked');
  expect(
    renderSection('socials', { title: 'Instagram', url: 'https://instagram.com/blackbox', visible: true }).markup,
  ).toContain('Shown on the website');
});

test('a new service takes its link name from the title until staff change it', () => {
  const view = renderSection('services', { services: { items: [{ id: '', title: '' }] } });
  expect(view.markup).toContain('/services#…');
  controls.inputs.find((input) => input['data-content-path'] === 'services.items.0.title')!.onChange!({
    target: { value: 'Vinyl Mastering' },
  } as never);
  expect((view.data().services as { items: Array<{ id: string }> }).items[0]!.id).toBe('vinyl-mastering');
  view.render();
  controls.inputs.find((input) => input['data-content-path'] === 'services.items.0.title')!.onChange!({
    target: { value: 'Vinyl Mastering & Cutting' },
  } as never);
  expect((view.data().services as { items: Array<{ id: string }> }).items[0]!.id).toBe('vinyl-mastering-cutting');
  // A hand-made link name stays when the title changes.
  const kept = renderSection('services', { services: { items: [{ id: 'cutting-room', title: 'Cutting' }] } });
  controls.inputs.find((input) => input['data-content-path'] === 'services.items.0.title')!.onChange!({
    target: { value: 'Lacquer cutting' },
  } as never);
  expect((kept.data().services as { items: Array<{ id: string }> }).items[0]!.id).toBe('cutting-room');
});

test('each label fact can be chosen once', () => {
  const view = renderSection('about', {
    stats: {
      items: [
        { key: 'artists', label: 'Artists' },
        { key: 'year', label: 'Year' },
      ],
    },
  });
  const options = (index: number) =>
    String(
      renderToStaticMarkup(
        <>{controls.selects.find((s) => s['data-content-path'] === `stats.items.${index}.key`)!.children}</>,
      ),
    );
  expect(options(0)).toContain('Number of artists');
  expect(options(0)).not.toContain('Years active');
  expect(options(1)).toContain('Years active');
  expect(options(1)).not.toContain('Number of artists');
  expect(view.markup).toContain('2 facts');
});
