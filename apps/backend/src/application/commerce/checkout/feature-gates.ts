export const NATIVE_CHECKOUT_DISABLED_MESSAGE = 'Native checkout is temporarily unavailable.';

export type FeatureFlagReader = {
  isNativeCheckoutEnabled(): Promise<boolean>;
};

export type StoreCapabilities = {
  nativeCheckout: {
    enabled: boolean;
    unavailableReason: string | null;
  };
};

export async function readStoreCapabilities(featureFlags: FeatureFlagReader): Promise<StoreCapabilities> {
  const nativeCheckoutEnabled = await featureFlags.isNativeCheckoutEnabled();

  return {
    nativeCheckout: {
      enabled: nativeCheckoutEnabled,
      unavailableReason: nativeCheckoutEnabled ? null : NATIVE_CHECKOUT_DISABLED_MESSAGE,
    },
  };
}
