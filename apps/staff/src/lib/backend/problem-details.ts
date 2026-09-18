const legacyMessages: Record<string, string> = {
  ARTWORK_UNAVAILABLE: 'Artwork is temporarily unavailable.',
  CMS_NOT_INITIALIZED: 'The editorial workspace is temporarily unavailable.',
  CATALOG_UNAVAILABLE: 'The catalog is temporarily unavailable.',
  CONFIRMATION_REQUIRED: 'Confirmation is required for this action.',
  EXPORT_READ_SCOPES_REQUIRED: 'The requested export scopes are not allowed.',
  FORBIDDEN: 'Forbidden.',
  INVALID_EDITORIAL_REQUEST: 'The editorial request is invalid.',
  INVALID_EDITORIAL_SAVE: 'The editorial save is invalid.',
  INVALID_IDENTITY: 'The record identity is invalid.',
  INVALID_IMAGE: 'The uploaded image is invalid.',
  INVALID_REQUEST: 'Invalid request.',
  INVALID_SLUG: 'The editorial slug is invalid.',
  METHOD_NOT_ALLOWED: 'Method not allowed.',
  NOT_FOUND: 'Not Found',
  PREVIEW_FAILED: 'Preview could not update.',
  PUBLICATION_CONFLICT: 'The publication request conflicts with another request.',
  PUBLICATION_IN_PROGRESS: 'A publication is already in progress.',
  PUBLICATION_NOT_LIVE: 'The publication is not live.',
  PUBLICATION_STATUS_UNAVAILABLE: 'Publication status is temporarily unavailable.',
  PUBLICATION_UNAVAILABLE: 'Publication is temporarily unavailable.',
  REVISION_CHANGED: 'The saved revision changed.',
  REVISION_NOT_PUBLISHED: 'The requested revision is not published.',
  REVISION_REQUIRED: 'A saved revision is required.',
  SNAPSHOT_UNAVAILABLE: 'The published snapshot is temporarily unavailable.',
  UNSUPPORTED_COLLECTION: 'This content collection is not supported.',
  UNSUPPORTED_EDITORIAL_ACTION: 'This editorial action is not supported.',
  UNSUPPORTED_MEDIA_ACTION: 'This media action is not supported.',
  UPLOAD_TOO_LARGE: 'The uploaded file is too large.',
  USE_ITEM_PUBLICATION: 'Use item publication for selling-linked entries.',
};

export function extractSafeProblemDetail(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;

  const record = body as Record<string, unknown>;
  const type = record.type;
  const localType = typeof type === 'string' && /^\/problems\/[a-z][a-z0-9_]*$/.test(type);
  const detail = record.detail;
  if (localType && typeof detail === 'string' && detail.trim()) return detail.trim().slice(0, 1000);

  const legacy = record.error;
  if (typeof legacy === 'string' && (!('type' in record) || localType) && legacy.trim()) {
    return legacyMessages[legacy] ?? (/^[A-Z][A-Z0-9_]+$/.test(legacy) ? fallback : legacy.trim().slice(0, 1000));
  }
  if (legacy && typeof legacy === 'object' && (!('type' in record) || localType)) {
    const nested = legacy as { code?: unknown; message?: unknown };
    if (typeof nested.code === 'string' && legacyMessages[nested.code]) return legacyMessages[nested.code]!;
    const message = nested.message;
    if (typeof message === 'string' && message.trim()) return message.trim().slice(0, 1000);
  }

  return fallback;
}
