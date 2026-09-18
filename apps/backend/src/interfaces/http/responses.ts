import { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { AppEnv } from '../../env';

const PROBLEM_JSON_MEDIA_TYPE = 'application/problem+json';

type ProblemDefinition = {
  title: string;
  defaultDetail: string;
  statuses: readonly number[];
};

const problemRegistry = {
  invalid_request: { title: 'Invalid request.', defaultDetail: 'Invalid request.', statuses: [400] },
  unsupported_collection: {
    title: 'Unsupported collection.',
    defaultDetail: 'This content collection is not supported.',
    statuses: [400],
  },
  unsupported_editorial_action: {
    title: 'Unsupported editorial action.',
    defaultDetail: 'This editorial action is not supported.',
    statuses: [405],
  },
  invalid_editorial_request: {
    title: 'Invalid editorial request.',
    defaultDetail: 'The editorial request is invalid.',
    statuses: [400],
  },
  invalid_slug: { title: 'Invalid slug.', defaultDetail: 'The editorial slug is invalid.', statuses: [400] },
  confirmation_required: {
    title: 'Confirmation required.',
    defaultDetail: 'Confirmation is required for this action.',
    statuses: [400],
  },
  not_found: { title: 'Not Found', defaultDetail: 'Not Found', statuses: [404] },
  method_not_allowed: { title: 'Method not allowed.', defaultDetail: 'Method not allowed.', statuses: [405] },
  unauthorized: { title: 'Unauthorized.', defaultDetail: 'Unauthorized.', statuses: [401] },
  forbidden: { title: 'Forbidden.', defaultDetail: 'Forbidden.', statuses: [403] },
  http_error: { title: 'Request failed.', defaultDetail: 'Request failed.', statuses: [] },
  internal_server_error: {
    title: 'Internal Server Error',
    defaultDetail: 'Internal Server Error',
    statuses: [500],
  },
  operator_access_unavailable: {
    title: 'Operator access temporarily unavailable.',
    defaultDetail: 'Operator access temporarily unavailable.',
    statuses: [503],
  },
  checkout_unavailable: {
    title: 'Checkout unavailable.',
    defaultDetail: 'Checkout unavailable.',
    statuses: [409, 503],
  },
  catalog_drift: {
    title: 'Catalog drift.',
    defaultDetail: 'The catalog needs review before checkout.',
    statuses: [409],
  },
  catalog_conflict: {
    title: 'Catalog conflict.',
    defaultDetail: 'The catalog changed. Reload before trying again.',
    statuses: [409],
  },
  catalog_temporarily_unavailable: {
    title: 'Catalog temporarily unavailable.',
    defaultDetail: 'The catalog is temporarily unavailable.',
    statuses: [503],
  },
  stock_conflict: {
    title: 'Stock conflict.',
    defaultDetail: 'Stock changed. Refresh and try again.',
    statuses: [409],
  },
  newsletter_unavailable: {
    title: 'Newsletter unavailable.',
    defaultDetail: 'Newsletter signup is temporarily unavailable.',
    statuses: [503],
  },
  services_inquiry_unavailable: {
    title: 'Services inquiry unavailable.',
    defaultDetail: 'Services inquiry submission is temporarily unavailable.',
    statuses: [503],
  },
  service_unavailable: {
    title: 'Service unavailable.',
    defaultDetail: 'The service is temporarily unavailable.',
    statuses: [503],
  },
  publication_conflict: {
    title: 'Publication conflict.',
    defaultDetail: 'The publication request conflicts with another request.',
    statuses: [409],
  },
  publication_not_live: {
    title: 'Publication is not live.',
    defaultDetail: 'The publication is not live.',
    statuses: [409],
  },
  publication_unavailable: {
    title: 'Publication unavailable.',
    defaultDetail: 'Publication is temporarily unavailable.',
    statuses: [503],
  },
  publication_status_unavailable: {
    title: 'Publication status unavailable.',
    defaultDetail: 'Publication status is temporarily unavailable.',
    statuses: [503],
  },
  publication_in_progress: {
    title: 'Publication in progress.',
    defaultDetail: 'A publication is already in progress.',
    statuses: [409],
  },
  catalog_unavailable: {
    title: 'Catalog unavailable.',
    defaultDetail: 'The catalog is temporarily unavailable.',
    statuses: [503],
  },
  snapshot_unavailable: {
    title: 'Snapshot unavailable.',
    defaultDetail: 'The published snapshot is temporarily unavailable.',
    statuses: [503],
  },
  revision_not_published: {
    title: 'Revision is not published.',
    defaultDetail: 'The requested revision is not published.',
    statuses: [409],
  },
  revision_changed: {
    title: 'Revision changed.',
    defaultDetail: 'The saved revision changed.',
    statuses: [409],
  },
  artwork_unavailable: {
    title: 'Artwork unavailable.',
    defaultDetail: 'Artwork is temporarily unavailable.',
    statuses: [503],
  },
  cms_not_initialized: {
    title: 'Editorial workspace unavailable.',
    defaultDetail: 'The editorial workspace is temporarily unavailable.',
    statuses: [503],
  },
  export_read_scopes_required: {
    title: 'Export scopes required.',
    defaultDetail: 'The requested export scopes are not allowed.',
    statuses: [400],
  },
  invalid_editorial_save: {
    title: 'Invalid editorial save.',
    defaultDetail: 'The editorial save is invalid.',
    statuses: [400, 422],
  },
  unsupported_media_action: {
    title: 'Unsupported media action.',
    defaultDetail: 'This media action is not supported.',
    statuses: [405],
  },
  invalid_identity: {
    title: 'Invalid identity.',
    defaultDetail: 'The record identity is invalid.',
    statuses: [400],
  },
  revision_required: {
    title: 'Revision required.',
    defaultDetail: 'A saved revision is required.',
    statuses: [400],
  },
  use_item_publication: {
    title: 'Item publication required.',
    defaultDetail: 'Use item publication for selling-linked entries.',
    statuses: [409],
  },
  upload_too_large: {
    title: 'Upload too large.',
    defaultDetail: 'The uploaded file is too large.',
    statuses: [413],
  },
  invalid_image: {
    title: 'Invalid image.',
    defaultDetail: 'The uploaded image is invalid.',
    statuses: [400],
  },
  preview_failed: {
    title: 'Preview failed.',
    defaultDetail: 'Preview could not update.',
    statuses: [422],
  },
} as const satisfies Record<string, ProblemDefinition>;

const cmsLegacyProblemCodes = {
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  INVALID_REQUEST: 'invalid_request',
  METHOD_NOT_ALLOWED: 'method_not_allowed',
  PUBLICATION_CONFLICT: 'publication_conflict',
  PUBLICATION_NOT_LIVE: 'publication_not_live',
  PUBLICATION_UNAVAILABLE: 'publication_unavailable',
  PUBLICATION_STATUS_UNAVAILABLE: 'publication_status_unavailable',
  PUBLICATION_IN_PROGRESS: 'publication_in_progress',
  CATALOG_UNAVAILABLE: 'catalog_unavailable',
  SNAPSHOT_UNAVAILABLE: 'snapshot_unavailable',
  REVISION_NOT_PUBLISHED: 'revision_not_published',
  REVISION_CHANGED: 'revision_changed',
  ARTWORK_UNAVAILABLE: 'artwork_unavailable',
  CMS_NOT_INITIALIZED: 'cms_not_initialized',
  EXPORT_READ_SCOPES_REQUIRED: 'export_read_scopes_required',
  INVALID_EDITORIAL_SAVE: 'invalid_editorial_save',
  UNSUPPORTED_MEDIA_ACTION: 'unsupported_media_action',
  INVALID_IDENTITY: 'invalid_identity',
  REVISION_REQUIRED: 'revision_required',
  USE_ITEM_PUBLICATION: 'use_item_publication',
  UPLOAD_TOO_LARGE: 'upload_too_large',
  INVALID_IMAGE: 'invalid_image',
  PREVIEW_FAILED: 'preview_failed',
} as const;

type CmsNestedLegacyError = { code: string; message?: string } | { message: string; code?: string };

type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  code: string;
  requestId?: string;
};

type ProblemDetailsInput = {
  code: string;
  detail?: string;
  status: number;
  requestId?: string;
};

const problemDetailsSchema = z
  .object({
    type: z.string().regex(/^\/problems\/[a-z][a-z0-9_]*$/),
    title: z.string().min(1),
    status: z.number().int().min(100).max(599),
    detail: z.string().min(1),
    code: z.string().regex(/^[a-z][a-z0-9_]*$/),
    requestId: z.string().min(1).optional(),
  })
  .openapi('ProblemDetails');

const backendErrorResponseSchema = z
  .intersection(problemDetailsSchema, z.object({ error: z.string().min(1) }))
  .openapi('BackendErrorResponse');

export const problemContent = {
  [PROBLEM_JSON_MEDIA_TYPE]: { schema: backendErrorResponseSchema },
} as const;

type CmsStringProblemDetails = ProblemDetails & { error: string };
type CmsNestedProblemDetails = ProblemDetails & { error: CmsNestedLegacyError };

export const operatorAccessErrorResponses = {
  401: {
    content: problemContent,
    description: 'Operator authentication failed.',
  },
  503: {
    content: problemContent,
    description: 'Operator authentication is temporarily unavailable.',
  },
} as const;

export type BackendErrorResponseInput<TStatus extends ContentfulStatusCode = ContentfulStatusCode> = {
  code: string;
  message: string;
  status: TStatus;
};

export function jsonNoStore<TResponse extends Response>(response: TResponse): TResponse {
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

export function buildProblemDetails(input: ProblemDetailsInput): ProblemDetails {
  const code = normalizeProblemCode(input.code);
  const definition = problemRegistry[code as keyof typeof problemRegistry] ?? {
    title: 'Request failed.',
    defaultDetail: 'Request failed.',
    statuses: [],
  };
  const detail =
    typeof input.detail === 'string' && input.detail.trim()
      ? input.detail.trim().slice(0, 1000)
      : definition.defaultDetail;

  return {
    type: `/problems/${code}`,
    title: definition.title,
    status: input.status,
    detail,
    code,
    ...(input.requestId?.trim() ? { requestId: input.requestId.trim() } : {}),
  };
}

function createCmsStringProblemBody(input: {
  code?: string;
  detail?: string;
  error: string;
  requestId?: string;
  status: number;
}): CmsStringProblemDetails {
  return {
    ...buildProblemDetails({
      code: input.code ?? problemCodeForLegacyError(input.error),
      detail: input.detail,
      requestId: input.requestId,
      status: input.status,
    }),
    error: input.error,
  };
}

export function createCmsNestedProblemBody(input: {
  code?: string;
  detail?: string;
  error: CmsNestedLegacyError;
  requestId?: string;
  status: number;
}): CmsNestedProblemDetails {
  return {
    ...buildProblemDetails({
      code: input.code ?? (input.error.code ? problemCodeForLegacyError(input.error.code) : 'invalid_request'),
      detail: input.detail ?? input.error.message,
      requestId: input.requestId,
      status: input.status,
    }),
    error: input.error,
  };
}

export function problemResponse(body: object, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', PROBLEM_JSON_MEDIA_TYPE);

  return new Response(JSON.stringify(body), { ...init, headers });
}

export function cmsStringProblemResponse(
  status: number,
  error: string,
  options: { code?: string; detail?: string; headers?: HeadersInit; requestId?: string } = {},
): Response {
  const headers = new Headers(options.headers);
  headers.set('Cache-Control', headers.get('Cache-Control') ?? 'private, no-store');

  return problemResponse(createCmsStringProblemBody({ ...options, error, status }), { status, headers });
}

export function cmsNestedProblemResponse(
  status: number,
  error: CmsNestedLegacyError,
  options: { code?: string; detail?: string; headers?: HeadersInit; requestId?: string } = {},
): Response {
  const headers = new Headers(options.headers);
  headers.set('Cache-Control', headers.get('Cache-Control') ?? 'private, no-store');

  return problemResponse(createCmsNestedProblemBody({ ...options, error, status }), { status, headers });
}

export function jsonError<TStatus extends ContentfulStatusCode>(
  context: Context<AppEnv>,
  input: BackendErrorResponseInput<TStatus>,
) {
  const body = buildProblemDetails({
    code: input.code,
    detail: input.message,
    requestId: context.get('requestId'),
    status: input.status,
  });
  const response = context.json({ ...body, error: body.detail }, input.status);
  response.headers.set('Content-Type', PROBLEM_JSON_MEDIA_TYPE);
  return jsonNoStore(response);
}

function problemCodeForLegacyError(code: string): string {
  return normalizeProblemCode(cmsLegacyProblemCodes[code as keyof typeof cmsLegacyProblemCodes] ?? code);
}

function normalizeProblemCode(value: string): string {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

  return /^[a-z][a-z0-9_]*$/.test(normalized) ? normalized : 'internal_server_error';
}
