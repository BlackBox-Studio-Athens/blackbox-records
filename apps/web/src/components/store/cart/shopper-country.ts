let countryRequest: Promise<string | null> | undefined;

export type DeliveryDestination = 'GR' | 'international';
const deliveryDestinationKey = 'blackbox:delivery-destination';
const deliveryDestinationEvent = 'blackbox:delivery-destination-updated';
let deliveryDestination: DeliveryDestination | null | undefined;

export function getDeliveryDestination(): DeliveryDestination | null {
  if (typeof window === 'undefined') return null;
  if (deliveryDestination !== undefined) return deliveryDestination;
  try {
    const stored = window.sessionStorage.getItem(deliveryDestinationKey);
    deliveryDestination = stored === 'GR' || stored === 'international' ? stored : null;
  } catch {
    deliveryDestination = null;
  }
  return deliveryDestination;
}

export function setDeliveryDestination(destination: DeliveryDestination): void {
  deliveryDestination = destination;
  try {
    window.sessionStorage.setItem(deliveryDestinationKey, destination);
  } catch {
    // The deliberate choice still applies to every placement in this document.
  }
  window.dispatchEvent(new Event(deliveryDestinationEvent));
}

export function subscribeDeliveryDestination(listener: () => void): () => void {
  window.addEventListener(deliveryDestinationEvent, listener);
  return () => window.removeEventListener(deliveryDestinationEvent, listener);
}

function validCountry(value: string | null): string | null {
  return value && /^[A-Z]{2}$/.test(value) && value !== 'XX' ? value : null;
}

export function parseShopperCountry(trace: string): string | null {
  const locations = trace.split(/\r?\n/).filter((line) => line.startsWith('loc='));
  return locations.length === 1 ? validCountry(locations[0]!.slice(4)) : null;
}

async function lookupShopperCountry(): Promise<string | null> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      resolve(null);
      controller.abort();
    }, 3000);
  });

  try {
    // The race also bounds a stalled response body or a fetch that ignores abort.
    // ponytail: trace is a troubleshooting endpoint; use an existing Worker read if its format changes.
    // Network location can change or reflect a roaming proxy. Persist only the shopper's delivery choice.
    return await Promise.race([
      fetch('/cdn-cgi/trace', { signal: controller.signal }).then(async (response) =>
        response.ok ? parseShopperCountry(await response.text()) : null,
      ),
      timeout,
    ]);
  } catch {
    return null;
  } finally {
    clearTimeout(timer!);
  }
}

export function resolveShopperCountry(): Promise<string | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return (countryRequest ??= lookupShopperCountry());
}
