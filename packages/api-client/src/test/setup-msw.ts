import { afterAll, afterEach, beforeAll } from 'vitest';

import { apiClientMswServer } from './msw-server';

beforeAll(() => {
  apiClientMswServer.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  apiClientMswServer.resetHandlers();
});

afterAll(() => {
  apiClientMswServer.close();
});
