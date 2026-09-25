import type * as PublicRuntimeModule from './public-runtime';

export {};

declare global {
  namespace Cloudflare {
    interface GlobalProps {
      mainModule: typeof PublicRuntimeModule;
      durableNamespaces: 'PublicSiteRuntime';
    }
  }
}
