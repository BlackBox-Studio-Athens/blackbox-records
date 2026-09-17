import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import StaffShell from './StaffShell';

it.each([
  ['mock', 'http://127.0.0.1:4321/blackbox-records/'],
  ['uat', 'https://blackbox-records-web-uat.pages.dev/'],
  ['prd', 'https://blackbox-records-web.pages.dev/'],
])('links the %s workspace to its own public website', (environment, href) => {
  const html = renderToStaticMarkup(
    <StaffShell title="Overview" environment={environment}>
      Workspace
    </StaffShell>,
  );
  expect(html).toContain(`href="${href}" target="_blank" rel="noopener noreferrer"`);
  expect(html.includes('Test environment')).toBe(environment === 'uat');
});
