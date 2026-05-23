import { setupServer } from 'msw/node';

import { createApiClientHandlers } from './msw-handlers';

export const apiClientMswServer = setupServer(...createApiClientHandlers());
