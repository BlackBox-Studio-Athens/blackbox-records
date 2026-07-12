interface ImportMetaEnv {
  readonly PUBLIC_BACKEND_BASE_URL?: string;
  readonly PUBLIC_CHECKOUT_CLIENT_MODE?: 'mock' | 'stripe';
  readonly SHOW_REVIEW_SITE_MARKER?: 'true';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
