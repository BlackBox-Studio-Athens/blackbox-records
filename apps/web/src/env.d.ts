interface ImportMetaEnv {
  readonly PUBLIC_BACKEND_BASE_URL?: string;
  readonly PUBLIC_CHECKOUT_CLIENT_MODE?: 'mock' | 'stripe';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
