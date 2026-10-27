import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import StaffBack from './StaffBack';

// The first render targets Overview until the browser reads the real return; server markup shows that state.
describe('StaffBack', () => {
  it('omits a return that only leads to Overview when asked', () => {
    expect(renderToStaticMarkup(<StaffBack skipOverview />)).toBe('');
  });

  it('keeps the return by default for task views', () => {
    expect(renderToStaticMarkup(<StaffBack />)).toContain('Back to Overview');
  });
});
