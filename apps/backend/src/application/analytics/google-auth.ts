import { z } from 'zod';
import type { AppBindings } from '../../platform/env';
import { boundedJson, StatsReadFailure } from './report';

const credentialsSchema = z.object({
  type: z.literal('service_account'),
  client_email: z.string().email().max(512),
  private_key_id: z.string().min(1).max(512),
  private_key: z.string().min(1).max(16384),
});
const tokenSchema = z.object({
  access_token: z.string().min(1).max(16384),
  token_type: z.literal('Bearer'),
  expires_in: z.number().int().positive().max(86400),
});
const tokenUrl = 'https://oauth2.googleapis.com/token';
const encode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
let completedToken: { key: string; token: string; expiresAt: number } | undefined;
export const invalidateGoogleSearchToken = () => {
  completedToken = undefined;
};

export async function signGoogleSearchAssertion(credentialsText: string): Promise<string> {
  try {
    const credentials = credentialsSchema.parse(JSON.parse(credentialsText) as unknown);
    const key = await crypto.subtle.importKey(
      'pkcs8',
      Uint8Array.from(
        atob(credentials.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')),
        (character) => character.charCodeAt(0),
      ),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const json = (value: object) => encode(new TextEncoder().encode(JSON.stringify(value)));
    const issuedAt = Math.floor(Date.now() / 1000);
    const input = `${json({ alg: 'RS256', typ: 'JWT', kid: credentials.private_key_id })}.${json({ iss: credentials.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: tokenUrl, iat: issuedAt, exp: issuedAt + 3600 })}`;
    return `${input}.${encode(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(input))))}`;
  } catch {
    throw new StatsReadFailure('upstream_auth');
  }
}

export async function googleSearchToken(bindings: AppBindings, signal: AbortSignal): Promise<string> {
  const credentials = bindings.GOOGLE_SEARCH_CONSOLE_CREDENTIALS!;
  const digest = encode(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(credentials))));
  const key = `${bindings.PRODUCT_ENVIRONMENT}/${digest}`;
  if (completedToken?.key === key && completedToken.expiresAt > Date.now()) return completedToken.token;
  const assertion = await signGoogleSearchAssertion(credentials);
  const parsed = tokenSchema.safeParse(
    await boundedJson(
      await fetch(tokenUrl, {
        method: 'POST',
        redirect: 'manual',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }).toString(),
        signal,
      }),
      128 * 1024,
    ),
  );
  if (!parsed.success) throw new StatsReadFailure('upstream_auth');
  completedToken = {
    key,
    token: parsed.data.access_token,
    expiresAt: Date.now() + parsed.data.expires_in * 1000 - 60000,
  };
  return completedToken.token;
}
