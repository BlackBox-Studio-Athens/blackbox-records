import { PrismaD1 } from '@prisma/adapter-d1';

import type { AppBindings } from '../../../env';
import { PrismaClient } from '../../../generated/prisma/client';

export function createPrismaClient(bindings: Pick<AppBindings, 'COMMERCE_DB'>): PrismaClient {
    const adapter = new PrismaD1(bindings.COMMERCE_DB);

    return new PrismaClient({ adapter });
}
