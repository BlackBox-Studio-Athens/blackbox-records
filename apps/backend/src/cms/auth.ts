import { env } from 'cloudflare:workers';
import type { AppBindings } from '../env';
import { verifyOperatorAccess } from '../interfaces/http/auth';

// Use EmDash's auth-provider interface with the same strict verifier as commerce.
export async function authenticate(request: Request) {
  const bindings = env as unknown as AppBindings & { CMS_HOSTNAME?: string; CMS_OWNER_EMAIL?: string };
  if (bindings.PRODUCT_ENVIRONMENT !== 'LOCAL' && new URL(request.url).hostname !== bindings.CMS_HOSTNAME) {
    throw new Error('Unauthorized hostname');
  }
  const result = await verifyOperatorAccess(request, bindings);
  if (result.status !== 'verified') throw new Error('Unauthorized');
  const owner = bindings.PRODUCT_ENVIRONMENT === 'LOCAL' || result.identity.email === bindings.CMS_OWNER_EMAIL;
  return { email: result.identity.email, name: result.identity.email, role: owner ? 50 : 30 };
}
