import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import ContentFields from './ContentFields';

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
