import { execFile } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import { z } from 'zod';
import { environmentOf, OpsError, type OperatorEnvironment } from './arguments';

const staffOrigins = {
  uat: 'https://staff-uat.blackboxrecordsathens.com',
  prd: 'https://staff.blackboxrecordsathens.com',
} as const;
const identityPath = '/api/internal/variants?limit=1';
const tokenIdentity = z.object({ email: z.email() });

export function staffOrigin(env: OperatorEnvironment) {
  return staffOrigins[environmentOf(env)];
}

type Cloudflared = (args: string[], timeout: number) => Promise<string>;
const exec = promisify(execFile);
const runCloudflared: Cloudflared = async (args, timeout) => {
  const { stdout } = await exec('cloudflared', args, { timeout, windowsHide: true, maxBuffer: 64 * 1024 });
  return stdout;
};

type AccessDependencies = {
  cloudflared?: Cloudflared;
  fetcher?: typeof fetch;
  wait?: (ms: number) => Promise<void>;
};

type RequestOptions = { body?: object; idempotencyKey?: string };

class UnconfirmedRequest extends OpsError {}

export function createStaffClient(
  env: OperatorEnvironment,
  { cloudflared = runCloudflared, fetcher = fetch, wait = delay }: AccessDependencies = {},
) {
  const origin = staffOrigin(env);
  const loginHint = `Run pnpm ops login ${env}.`;

  async function accessToken(): Promise<string> {
    const token = await cloudflared(['access', 'token', `-app=${origin}`], 10_000)
      .then((stdout) => stdout.trim())
      .catch(() => '');
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      throw new OpsError(`Access token unavailable. ${loginHint}`);
    }
    return token;
  }

  async function requestOnce(url: URL, token: string, body?: BodyInit, idempotencyKey?: string): Promise<unknown> {
    const headers = new Headers({
      accept: 'application/json',
      'cf-access-token': token,
    });
    if (url.pathname.startsWith('/_emdash/api/')) headers.set('X-EmDash-Request', '1');
    if (body !== undefined) {
      headers.set('Origin', origin);
      if (url.pathname.startsWith('/api/internal/')) headers.set('X-Blackbox-Request', '1');
      if (typeof body === 'string') headers.set('Content-Type', 'application/json');
    }
    if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey);

    let response: Response;
    try {
      response = await fetcher(url, {
        method: body === undefined ? 'GET' : 'POST',
        ...(body === undefined ? {} : { body }),
        headers,
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new UnconfirmedRequest('Staff did not confirm the request.');
    }
    if (!response.ok || response.redirected || response.type === 'opaqueredirect') {
      await response.body?.cancel().catch(() => undefined);
      if (
        response.redirected ||
        response.type === 'opaqueredirect' ||
        (response.status >= 300 && response.status < 400)
      ) {
        throw new OpsError(`Staff redirected the request. ${loginHint}`);
      }
      if (response.status === 401) throw new OpsError(`Staff could not verify Access. ${loginHint}`);
      const message = `Staff returned HTTP ${response.status}.`;
      if ([502, 503, 504].includes(response.status)) throw new UnconfirmedRequest(message);
      throw new OpsError(message);
    }
    try {
      return await response.json();
    } catch {
      throw new UnconfirmedRequest('Staff did not return a readable result.');
    }
  }

  return {
    async login() {
      try {
        await cloudflared(['access', 'login', origin], 120_000);
      } catch {
        throw new OpsError(`Access login failed. Check cloudflared and sign in when your browser opens. ${loginHint}`);
      }
    },
    async whoami() {
      const token = await accessToken();
      // The internal read runs the Worker's JWT verifier without EmDash user provisioning.
      const result = await requestOnce(new URL(identityPath, origin), token);
      if (!Array.isArray(result)) throw new OpsError('Identity check returned an unexpected Staff response.');
      try {
        const payload = Buffer.from(token.split('.')[1], 'base64url').toString('utf8');
        return tokenIdentity.parse(JSON.parse(payload)).email;
      } catch {
        throw new OpsError('Verified Access token did not contain an operator email.');
      }
    },
    async request(path: string, { body, idempotencyKey }: RequestOptions = {}) {
      const url = new URL(path, origin);
      if (
        !path.startsWith('/') ||
        url.protocol !== 'https:' ||
        url.origin !== origin ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        !['/api/internal/', '/_emdash/api/'].some((prefix) => url.pathname.startsWith(prefix))
      )
        throw new OpsError('Request must use the selected HTTPS Staff API.');

      const payload = body === undefined || body instanceof FormData ? body : JSON.stringify(body);
      const attempt = async () => requestOnce(url, await accessToken(), payload, idempotencyKey);
      try {
        return await attempt();
      } catch (error) {
        if (payload === undefined || !(error instanceof UnconfirmedRequest)) throw error;
        await wait(1_000);
        return attempt();
      }
    },
  };
}

export type StaffClient = ReturnType<typeof createStaffClient>;
