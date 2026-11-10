import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type * as ButtonModule from '../ui/button';
import type * as InputModule from '../ui/input';
import LineupFields, { type LineupEntry } from './LineupFields';

const controls = vi.hoisted(() => ({
  buttons: [] as Array<{ children?: unknown; disabled?: boolean; onClick?: () => void }>,
  inputs: [] as Array<{ id?: string; onChange?: (event: { target: { value: string } }) => void }>,
  segments: [] as Array<{ label: string; value?: string; onChange(value: string): void }>,
  pickers: [] as Array<{
    collection: string;
    label: string;
    filter?: (item: { id: string; data: Record<string, unknown> }) => boolean;
    onSelect(item: { id: string }): void;
    error?: string;
  }>,
}));
vi.mock('../ui/button', async (importOriginal) => {
  const actual = await importOriginal<typeof ButtonModule>();
  return {
    ...actual,
    Button: (props: ComponentProps<typeof actual.Button>) => {
      controls.buttons.push(props as never);
      return <actual.Button {...props} />;
    },
  };
});
vi.mock('../ui/input', async (importOriginal) => {
  const actual = await importOriginal<typeof InputModule>();
  return {
    ...actual,
    Input: (props: ComponentProps<typeof actual.Input>) => {
      controls.inputs.push(props as never);
      return <actual.Input {...props} />;
    },
  };
});
vi.mock('../fields/SegmentedChoice', () => ({
  default: (props: (typeof controls.segments)[number]) => {
    controls.segments.push(props);
    return <span>{props.value}</span>;
  },
}));
vi.mock('./EditorialPicker', () => ({
  default: (props: (typeof controls.pickers)[number]) => {
    controls.pickers.push(props);
    return <span>{props.error}</span>;
  },
}));

function harness(initial: LineupEntry[], errors: Record<string, string[]> = {}) {
  let value = initial;
  const render = () => {
    controls.buttons = [];
    controls.inputs = [];
    controls.segments = [];
    controls.pickers = [];
    return renderToStaticMarkup(
      <LineupFields
        base=""
        value={value}
        onChange={(next) => (value = next)}
        errorsFor={(path) => errors[path] ?? []}
      />,
    );
  };
  // Each row has a Billing then an Act segmented choice.
  const segment = (row: number, label: 'Billing' | 'Act') =>
    controls.segments.filter((props) => props.label === label)[row]!;
  const button = (label: string) => controls.buttons.find((props) => JSON.stringify(props.children).includes(label))!;
  return { render, button, segment, value: () => value };
}

test('staff add Hylas as an opening act by plain name', () => {
  const lineup = harness([{ role: 'headliner', artist: 'sidus' }]);
  lineup.render();
  lineup.button('Add act').onClick!();
  expect(lineup.value()[1]).toEqual({ role: 'opening', artist: '' });
  lineup.render();
  lineup.segment(1, 'Act').onChange('name');
  lineup.render();
  controls.inputs.find((props) => props.id === 'lineup-1-name')!.onChange!({ target: { value: 'Hylas' } });
  expect(lineup.value()[1]).toEqual({ role: 'opening', name: 'Hylas' });
});

test('the Release choice lists only the chosen Artist Releases, and only for a Headliner', () => {
  const lineup = harness([{ role: 'headliner', artist: 'sidus' }]);
  lineup.render();
  const release = controls.pickers.find((props) => props.collection === 'releases')!;
  expect(release.filter!({ id: 'lotus', data: { artist: 'sidus' } })).toBe(true);
  expect(release.filter!({ id: 'disintegration', data: { artist: 'afterwise' } })).toBe(false);
  release.onSelect({ id: 'lotus' });
  expect(lineup.value()[0]).toEqual({ role: 'headliner', artist: 'sidus', release: 'lotus' });

  lineup.render();
  lineup.segment(0, 'Billing').onChange('opening');
  expect(lineup.value()[0]).toEqual({ role: 'opening', artist: 'sidus' });
  lineup.render();
  expect(controls.pickers.some((props) => props.collection === 'releases')).toBe(false);

  // Choosing another Artist clears the old Release.
  const swap = harness([{ role: 'headliner', artist: 'sidus', release: 'lotus' }]);
  swap.render();
  controls.pickers.find((props) => props.collection === 'artists')!.onSelect({ id: 'afterwise' });
  expect(swap.value()[0]).toEqual({ role: 'headliner', artist: 'afterwise' });
});

test('acts reorder with Move up and Move down, and the ends are disabled', () => {
  const lineup = harness([
    { role: 'headliner', artist: 'sidus' },
    { role: 'headliner', artist: 'afterwise' },
    { role: 'opening', name: 'Hylas' },
  ]);
  lineup.render();
  const ups = controls.buttons.filter((props) => JSON.stringify(props.children).includes('Move up'));
  const downs = controls.buttons.filter((props) => JSON.stringify(props.children).includes('Move down'));
  expect(ups[0]!.disabled).toBe(true);
  expect(downs[2]!.disabled).toBe(true);
  ups[1]!.onClick!();
  expect(lineup.value().map((entry) => entry.artist ?? entry.name)).toEqual(['afterwise', 'sidus', 'Hylas']);
});

test('field-scoped validation messages reach the list and the row', () => {
  const html = harness([{ role: 'opening', name: '' }], {
    lineup: ['Add at least one Headliner.'],
    'lineup.0.artist': ['Choose an Artist or enter a name.'],
  }).render();
  expect(html).toContain('Add at least one Headliner.');
  // A name-only row shows the shared rule's `artist` message beside its name input.
  expect(html).toContain('Choose an Artist or enter a name.');
});
