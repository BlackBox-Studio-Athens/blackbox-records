import { setupServer } from 'msw/node';

import { createApiClientHandlers } from '@blackbox/api-client/test/msw-handlers';

export const webMswServer = setupServer(...createApiClientHandlers());
