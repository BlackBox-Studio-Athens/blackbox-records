import { describe, expect, it, vi } from 'vitest';

import {
  createConfiguredEmbeddedCheckoutAdapter,
  createMockEmbeddedCheckoutAdapter,
  createStripeEmbeddedCheckoutAdapter,
  readCheckoutClientMode,
} from './stripe-embedded-checkout';

describe('createStripeEmbeddedCheckoutAdapter', () => {
  it('reports a configuration error when the publishable key is missing', () => {
    const adapter = createStripeEmbeddedCheckoutAdapter({
      loadStripeClient: vi.fn(),
      publishableKey: '',
    });

    expect(adapter.getConfigurationError()).toBe('Stripe publishable key is not configured.');
  });

  it('loads Stripe and mounts embedded Checkout with the Worker client secret', async () => {
    const mountTarget = {} as HTMLElement;
    const checkout = {
      destroy: vi.fn(),
      mount: vi.fn(),
      unmount: vi.fn(),
    };
    const stripe = {
      createEmbeddedCheckoutPage: vi.fn(async () => checkout),
    };
    const adapter = createStripeEmbeddedCheckoutAdapter({
      loadStripeClient: vi.fn(async () => stripe as never),
      publishableKey: 'pk_test_blackbox',
    });

    const mount = await adapter.mountEmbeddedCheckout({
      clientSecret: 'cs_test_client_secret',
      mountTarget,
    });

    expect(stripe.createEmbeddedCheckoutPage).toHaveBeenCalledExactlyOnceWith({
      clientSecret: 'cs_test_client_secret',
    });
    expect(checkout.mount).toHaveBeenCalledExactlyOnceWith(mountTarget);

    mount.destroy();

    expect(checkout.destroy).toHaveBeenCalledOnce();
  });

  it('uses mock checkout mode without loading Stripe.js', async () => {
    const mountTarget = createMountTargetStub();
    const loadStripeClient = vi.fn();
    const adapter = createConfiguredEmbeddedCheckoutAdapter({
      loadStripeClient,
      mode: 'mock',
      publishableKey: '',
    });

    await adapter.mountEmbeddedCheckout({
      clientSecret: 'cs_mock_client_secret',
      mountTarget,
    });

    expect(loadStripeClient).not.toHaveBeenCalled();
    expect(mountTarget.setAttribute).toHaveBeenCalledWith('data-mock-checkout-panel', '');
    expect(mountTarget.textContent).toContain('Mock Checkout Started');
    expect(mountTarget.textContent).not.toContain('cs_mock_client_secret');
  });

  it('defaults unknown checkout client modes to real Stripe mode', () => {
    expect(readCheckoutClientMode(undefined)).toBe('stripe');
    expect(readCheckoutClientMode('anything-else')).toBe('stripe');
    expect(readCheckoutClientMode('mock')).toBe('mock');
  });

  it('clears the mock checkout panel when destroyed', async () => {
    const mountTarget = createMountTargetStub();
    const mount = await createMockEmbeddedCheckoutAdapter().mountEmbeddedCheckout({
      clientSecret: 'cs_mock_client_secret',
      mountTarget,
    });

    expect(mountTarget.textContent).toContain('Mock Checkout Started');

    mount.destroy();

    expect(mountTarget.removeAttribute).toHaveBeenCalledWith('data-mock-checkout-panel');
    expect(mountTarget.textContent).toBe('');
  });
});

function createMountTargetStub(): HTMLElement {
  return {
    className: '',
    removeAttribute: vi.fn(),
    setAttribute: vi.fn(),
    textContent: '',
  } as unknown as HTMLElement;
}
