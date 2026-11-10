import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import type { ComponentProps } from 'react';
import type * as InputModule from '../ui/input';
import type * as ButtonModule from '../ui/button';
import ChoiceChips, { addChoice } from './ChoiceChips';
import CountStepper from './CountStepper';
import DateField from './DateField';
import MoneyInput from './MoneyInput';
import { readServiceLink } from './ProviderUrlField';
import SegmentedChoice from './SegmentedChoice';
import TimeOfDayField from './TimeOfDayField';
import { clampCount, todayIsoDate, withHttps } from './field-values';

const controls = vi.hoisted(() => ({
  inputs: [] as Array<{ id?: string; onChange?: (event: { target: { value: string } }) => void }>,
  buttons: [] as Array<{ 'aria-label'?: string; children?: unknown; disabled?: boolean; onClick?: () => void }>,
}));
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

function render(element: React.ReactElement) {
  controls.inputs = [];
  controls.buttons = [];
  return renderToStaticMarkup(element);
}
const input = (id: string) => controls.inputs.find((props) => props.id === id)!;

test('Money stores typed euros as integer cents and never stores an unreadable amount', () => {
  const onChange = vi.fn();
  const markup = render(<MoneyInput id="price" value={1250} onChange={onChange} />);
  expect(markup).toContain('value="12.50"');
  expect(markup).toContain('€');
  input('price').onChange!({ target: { value: '12.345' } });
  expect(onChange).not.toHaveBeenCalled();
  input('price').onChange!({ target: { value: '15' } });
  expect(onChange).toHaveBeenLastCalledWith(1500);
  input('price').onChange!({ target: { value: '' } });
  expect(onChange).toHaveBeenLastCalledWith(null);
});

test('counts stay inside their bounds and state the limit', () => {
  expect(clampCount(30, 0, 23)).toEqual({ value: 23, limited: 'max' });
  expect(clampCount(-1, 0, 23)).toEqual({ value: 0, limited: 'min' });
  expect(clampCount(7, 0, 23)).toEqual({ value: 7, limited: null });
  const onChange = vi.fn();
  render(<CountStepper id="online" label="online copies" value={5} max={5} onChange={onChange} />);
  expect(controls.buttons.find((props) => props['aria-label'] === 'Increase online copies')!.disabled).toBe(true);
  input('online').onChange!({ target: { value: '9' } });
  expect(onChange).toHaveBeenLastCalledWith(5);
});

test('doors are 24-hour steppers in every locale', () => {
  const onChange = vi.fn();
  const markup = render(<TimeOfDayField path="doors" label="Doors open" value="20:00" onChange={onChange} />);
  expect(markup).toContain('value="20"');
  expect(markup).toContain('value="00"');
  expect(markup).toContain('24-hour time');
  expect(markup).not.toMatch(/μμ|PM/);
  input('content-doors-hour').onChange!({ target: { value: '21' } });
  expect(onChange).toHaveBeenLastCalledWith('21:00');

  const empty = vi.fn();
  render(<TimeOfDayField path="doors" label="Doors open" value={undefined} onChange={empty} />);
  input('content-doors-hour').onChange!({ target: { value: '19' } });
  expect(empty).toHaveBeenLastCalledWith('19:00');
});

test('a date reads back as a day in words, with a Today shortcut', () => {
  const onChange = vi.fn();
  const markup = render(<DateField path="date" label="Show date" value="2026-12-05" onChange={onChange} />);
  expect(markup).toContain('Sat 05 Dec 2026');
  controls.buttons.find((props) => JSON.stringify(props.children).includes('Today'))!.onClick!();
  expect(onChange).toHaveBeenCalledWith(todayIsoDate());
  expect(todayIsoDate(new Date(2026, 11, 5, 23, 30))).toBe('2026-12-05');
});

test('service links check the host and name the recognised service', () => {
  const wrongHost = readServiceLink('facebook', 'https://www.instagram.com/blackbox', '');
  expect(wrongHost.ok).toBe(false);
  if (!wrongHost.ok) expect(wrongHost.message).toMatch(/facebook\.com/i);
  expect(readServiceLink('any', 'https://www.more.com/gr-el/tickets/music/offer/sidus/', 'x')).toMatchObject({
    ok: true,
    label: 'More.com',
  });
  expect(readServiceLink('any', 'more com/sidus', 'Paste the full ticket page address')).toEqual({
    ok: false,
    message: 'Paste the full ticket page address',
  });
  expect(withHttps('more.com/x')).toBe('https://more.com/x');
  expect(withHttps('http://more.com/x')).toBe('http://more.com/x');
});

test('choice chips show known values as pressed buttons and add Other once', () => {
  expect(addChoice(['Post Metal'], ' post metal ')).toEqual(['Post Metal']);
  expect(addChoice(['Post Metal'], 'Doom')).toEqual(['Post Metal', 'Doom']);
  const onChange = vi.fn();
  const markup = render(
    <ChoiceChips
      path="venue"
      label="Venue"
      single
      options={['AN Club, Athens']}
      value={['AN Club, Athens']}
      onChange={onChange}
    />,
  );
  expect(markup).toContain('aria-pressed="true"');
  expect(markup).toContain('Other');
  controls.buttons.find((props) => JSON.stringify(props.children).includes('AN Club'))!.onClick!();
  expect(onChange).toHaveBeenLastCalledWith([]);
});

test('segmented choices label their group and mark the chosen option', () => {
  const markup = render(
    <SegmentedChoice
      label="Billing"
      value="opening"
      options={[
        { value: 'headliner', label: 'Headliner' },
        { value: 'opening', label: 'Opening act' },
      ]}
      onChange={() => {}}
    />,
  );
  expect(markup).toMatch(/aria-labelledby="[^"]+-label"/);
  expect(markup).toMatch(/data-state="on"[^>]*>Opening act|>Opening act/);
  expect(markup).toContain('min-h-11');
});
