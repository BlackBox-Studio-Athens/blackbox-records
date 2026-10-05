const countryCacheKey = 'blackbox:shopper-country';
let countryRequest: Promise<string | null> | undefined;

function validCountry(value: string | null): string | null {
  return value && /^[A-Z]{2}$/.test(value) && value !== 'XX' ? value : null;
}

export function parseShopperCountry(trace: string): string | null {
  const locations = trace.split(/\r?\n/).filter((line) => line.startsWith('loc='));
  return locations.length === 1 ? validCountry(locations[0]!.slice(4)) : null;
}

async function lookupShopperCountry(): Promise<string | null> {
  try {
    const cached = validCountry(window.sessionStorage.getItem(countryCacheKey));
    if (cached) return cached;
  } catch {
    // Private browsing and storage policies must not prevent the lookup.
  }

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
    const country = await Promise.race([
      fetch('/cdn-cgi/trace', { signal: controller.signal }).then(async (response) =>
        response.ok ? parseShopperCountry(await response.text()) : null,
      ),
      timeout,
    ]);
    if (country) {
      try {
        window.sessionStorage.setItem(countryCacheKey, country);
      } catch {
        // The shared promise still retains the result for this document.
      }
    }
    return country;
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
