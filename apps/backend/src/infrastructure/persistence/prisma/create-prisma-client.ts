import { PrismaD1 } from '@prisma/adapter-d1';

import type { AppBindings } from '../../../platform/env';
import { PrismaClient } from '../../../generated/prisma/client';

// Only bindings explicitly scoped to a Durable Object retain their client.
const objectClients = new WeakMap<Pick<AppBindings, 'COMMERCE_DB'>, { client?: PrismaClient }>();

export function createPrismaClientScope(bindings: AppBindings, parentScope?: AppBindings): AppBindings {
  const scopedBindings = { ...bindings };
  objectClients.set(scopedBindings, (parentScope && objectClients.get(parentScope)) ?? {});
  return scopedBindings;
}

export function createPrismaClient(bindings: Pick<AppBindings, 'COMMERCE_DB'>): PrismaClient {
  const scope = objectClients.get(bindings);
  if (scope?.client) return scope.client;
  const adapter = new PrismaD1(bindings.COMMERCE_DB);

  const client = new PrismaClient({ adapter });
  if (scope) {
    scope.client = client;
    // Request service cleanup must not disconnect the object's shared client.
    client.$disconnect = async () => {};
  }
  return client;
}
