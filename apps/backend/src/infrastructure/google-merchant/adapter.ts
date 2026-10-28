import { z } from 'zod';
import type { MerchantProductInput } from '../../application/commerce/merchant-sync';

export type GoogleMerchantConfig = {
  accountId: string;
  dataSourceId: string;
  expectedTestAccount: boolean;
  serviceAccount: { client_email: string; private_key: string };
};

type FailureReason = 'auth' | 'quota' | 'timeout' | 'network' | 'provider' | 'invalid-response' | 'invalid-source';

export class GoogleMerchantError extends Error {
  readonly sourceStop: boolean;

  constructor(
    readonly reason: FailureReason,
    readonly status?: number,
    sourceStop = reason === 'auth' || reason === 'quota' || reason === 'invalid-source',
  ) {
    super(`Google Merchant ${reason}`);
    this.name = 'GoogleMerchantError';
    this.sourceStop = sourceStop;
  }
}

const tokenUrl = 'https://oauth2.googleapis.com/token';
const apiUrl = 'https://merchantapi.googleapis.com';
const maximumResponseBytes = 64 * 1024;
const tokenSchema = z.object({
  access_token: z
    .string()
    .min(1)
    .max(16384)
    .regex(/^[\x21-\x7e]+$/),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().positive().max(3600),
});
const configSchema = z.object({
  accountId: z.string().regex(/^[1-9][0-9]{0,19}$/),
  dataSourceId: z.string().regex(/^[1-9][0-9]{0,19}$/),
  expectedTestAccount: z.boolean(),
  serviceAccount: z.object({
    client_email: z.string().email().max(512),
    private_key: z.string().min(1).max(16384),
  }),
});

export class GoogleMerchantAdapter {
  private readonly config: GoogleMerchantConfig;
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;
  private token?: { value: string; expiresAt: number };

  constructor(config: GoogleMerchantConfig, options: { fetch?: typeof fetch; timeoutMs?: number } = {}) {
    const parsed = configSchema.safeParse(config);
    const timeoutMs = options.timeoutMs ?? 3000;
    if (!parsed.success || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 10000)
      throw new GoogleMerchantError('invalid-source');
    this.config = parsed.data;
    this.fetcher = options.fetch ?? fetch;
    this.timeoutMs = timeoutMs;
  }

  async verifySource(): Promise<void> {
    try {
      const account = z
        .object({
          name: z.literal(`accounts/${this.config.accountId}`),
          accountId: z.literal(this.config.accountId),
          testAccount: z.boolean().optional(),
        })
        .safeParse(await this.authorized(`/accounts/v1/accounts/${this.config.accountId}`));
      if (!account.success || (account.data.testAccount ?? false) !== this.config.expectedTestAccount)
        throw new GoogleMerchantError('invalid-source');
      const source = z
        .object({
          name: z.literal(this.sourceName),
          input: z.literal('API'),
          primaryProductDataSource: z.object({
            countries: z.array(z.literal('GR')).length(1),
            contentLanguage: z.literal('en'),
            feedLabel: z.literal('GR'),
            legacyLocal: z.literal(false).optional(),
            destinations: z.array(z.object({ destination: z.string(), state: z.enum(['ENABLED', 'DISABLED']) })),
          }),
        })
        .safeParse(await this.authorized(`/datasources/v1/${this.sourceName}`));
      if (!source.success) throw new GoogleMerchantError('invalid-source');
      const destinations = source.data.primaryProductDataSource.destinations;
      if (
        !destinations.some((entry) => entry.destination === 'FREE_LISTINGS' && entry.state === 'ENABLED') ||
        destinations.some((entry) => entry.destination !== 'FREE_LISTINGS' && entry.state !== 'DISABLED') ||
        destinations.some((entry) => entry.destination === 'FREE_LISTINGS' && entry.state !== 'ENABLED')
      )
        throw new GoogleMerchantError('invalid-source');
    } catch (error) {
      if (error instanceof GoogleMerchantError && !error.sourceStop)
        throw new GoogleMerchantError(error.reason, error.status, true);
      throw error;
    }
  }

  async upsert(input: MerchantProductInput): Promise<void> {
    const identity = await this.identity(input.offerId);
    if (input.contentLanguage !== 'en' || input.feedLabel !== 'GR') throw new GoogleMerchantError('invalid-source');
    const result = z
      .object({
        name: z.string(),
        offerId: z.literal(identity.offerId),
        contentLanguage: z.literal('en'),
        feedLabel: z.literal('GR'),
      })
      .safeParse(
        await this.authorized(
          `/products/v1/accounts/${this.config.accountId}/productInputs:insert?${this.sourceQuery}`,
          {
            method: 'POST',
            body: JSON.stringify({ ...input, offerId: identity.offerId }),
          },
        ),
      );
    const prefix = `accounts/${this.config.accountId}/productInputs/`;
    if (
      !result.success ||
      ![prefix + identity.encoded, prefix + `en~GR~${identity.offerId}`].includes(result.data.name)
    )
      throw new GoogleMerchantError('invalid-response');
  }

  async checkQuota(): Promise<void> {
    try {
      const count = z
        .string()
        .regex(/^[0-9]{1,19}$/)
        .transform((value) => BigInt(value));
      const quotas = z
        .object({
          quotaGroups: z
            .array(
              z.object({
                name: z.string().startsWith(`accounts/${this.config.accountId}/quotas/`),
                quotaUsage: count.optional().transform((value) => value ?? 0n),
                quotaLimit: count,
                quotaMinuteLimit: count,
              }),
            )
            .min(1)
            .max(1000),
          nextPageToken: z.literal('').optional(),
        })
        .safeParse(await this.authorized(`/quota/v1/accounts/${this.config.accountId}/quotas?pageSize=1000`));
      if (!quotas.success) throw new GoogleMerchantError('invalid-response', undefined, true);
      // Google exposes daily usage, but no minute-usage counter; zero minute capacity still blocks recovery.
      if (
        quotas.data.quotaGroups.some((group) => group.quotaUsage >= group.quotaLimit || group.quotaMinuteLimit === 0n)
      )
        throw new GoogleMerchantError('quota');
    } catch (error) {
      if (error instanceof GoogleMerchantError && !error.sourceStop)
        throw new GoogleMerchantError(error.reason, error.status, true);
      throw error;
    }
  }

  async remove(offerId: string): Promise<void> {
    const identity = await this.identity(offerId);
    await this.authorized(
      `/products/v1/accounts/${this.config.accountId}/productInputs/${identity.encoded}?${this.sourceQuery}`,
      { method: 'DELETE' },
      true,
    );
  }

  private get sourceName(): string {
    return `accounts/${this.config.accountId}/dataSources/${this.config.dataSourceId}`;
  }

  private get sourceQuery(): string {
    return new URLSearchParams({ dataSource: this.sourceName }).toString();
  }

  private async identity(variantId: string): Promise<{ offerId: string; encoded: string }> {
    if (
      !variantId.trim() ||
      [...variantId].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    )
      throw new GoogleMerchantError('invalid-source');
    // Google offer IDs allow 50 characters; keep the full variant identity in the application ledger.
    const offerId =
      [...variantId].length <= 50
        ? variantId
        : `bb_${encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(variantId))))}`;
    return { offerId, encoded: encode(new TextEncoder().encode(`en~GR~${offerId}`)) };
  }

  private async authorized(path: string, init: RequestInit = {}, allowNotFound = false): Promise<unknown> {
    const token = await this.accessToken();
    try {
      return await this.request(
        apiUrl + path,
        { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
        allowNotFound,
      );
    } catch (error) {
      if (error instanceof GoogleMerchantError && error.reason === 'auth') this.token = undefined;
      throw error;
    }
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now()) return this.token.value;
    let assertion: string;
    try {
      const key = await crypto.subtle.importKey(
        'pkcs8',
        Uint8Array.from(
          atob(
            this.config.serviceAccount.private_key.replace(
              /-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,
              '',
            ),
          ),
          (character) => character.charCodeAt(0),
        ),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['sign'],
      );
      const json = (value: object) => encode(new TextEncoder().encode(JSON.stringify(value)));
      const issuedAt = Math.floor(Date.now() / 1000);
      const input = `${json({ alg: 'RS256', typ: 'JWT' })}.${json({
        iss: this.config.serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/content',
        aud: tokenUrl,
        iat: issuedAt,
        exp: issuedAt + 3600,
      })}`;
      assertion = `${input}.${encode(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input))))}`;
    } catch {
      throw new GoogleMerchantError('auth');
    }
    let response: unknown;
    try {
      response = await this.request(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
      });
    } catch (error) {
      if (error instanceof GoogleMerchantError && (error.status === 400 || error.reason === 'invalid-response'))
        throw new GoogleMerchantError('auth', error.status);
      if (error instanceof GoogleMerchantError) throw new GoogleMerchantError(error.reason, error.status, true);
      throw error;
    }
    const parsed = tokenSchema.safeParse(response);
    if (!parsed.success) throw new GoogleMerchantError('auth');
    this.token = { value: parsed.data.access_token, expiresAt: Date.now() + parsed.data.expires_in * 1000 - 60000 };
    return this.token.value;
  }

  private async request(url: string, init: RequestInit, allowNotFound = false): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(url, { ...init, redirect: 'manual', signal: controller.signal });
      if (allowNotFound && response.status === 404) {
        await response.body?.cancel();
        return null;
      }
      if (!response.ok || response.redirected) {
        await response.body?.cancel();
        const reason =
          response.status === 401 || response.status === 403 ? 'auth' : response.status === 429 ? 'quota' : 'provider';
        throw new GoogleMerchantError(reason, response.status);
      }
      if (allowNotFound) {
        await response.body?.cancel();
        return null;
      }
      return await boundedJson(response);
    } catch (error) {
      if (error instanceof GoogleMerchantError) throw error;
      throw new GoogleMerchantError(controller.signal.aborted ? 'timeout' : 'network');
    } finally {
      clearTimeout(timeout);
    }
  }
}

function encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function boundedJson(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new GoogleMerchantError('invalid-response');
  let size = 0;
  let text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximumResponseBytes) {
        await reader.cancel();
        throw new GoogleMerchantError('invalid-response');
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new GoogleMerchantError('invalid-response');
    }
  } finally {
    reader.releaseLock();
  }
}
