import { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { AppEnv } from '../../env';

export const backendErrorResponseSchema = z
  .object({
    code: z.string().regex(/^[a-z][a-z0-9_]*$/),
    error: z.string(),
    requestId: z.string().min(1).optional(),
  })
  .openapi('BackendErrorResponse');

export type BackendErrorResponse = z.infer<typeof backendErrorResponseSchema>;

export type BackendErrorResponseInput<TStatus extends ContentfulStatusCode = ContentfulStatusCode> = {
  code: string;
  message: string;
  status: TStatus;
};

export function jsonNoStore<TResponse extends Response>(response: TResponse): TResponse {
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

export function createBackendErrorBody(
  context: Context<AppEnv>,
  input: Pick<BackendErrorResponseInput, 'code' | 'message'>,
): BackendErrorResponse {
  const requestId = context.get('requestId');

  return {
    code: input.code,
    error: input.message,
    ...(requestId ? { requestId } : {}),
  };
}

export function jsonError<TStatus extends ContentfulStatusCode>(
  context: Context<AppEnv>,
  input: BackendErrorResponseInput<TStatus>,
) {
  return jsonNoStore(context.json(createBackendErrorBody(context, input), input.status));
}
