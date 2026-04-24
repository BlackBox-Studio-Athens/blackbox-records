interface ImportMetaEnv {
    readonly PUBLIC_BACKEND_BASE_URL?: string;
    readonly PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
