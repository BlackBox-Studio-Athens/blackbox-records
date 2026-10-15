import type { BrowserContext, ConsoleMessage, Page } from 'playwright';
import { uatAccessHeaders } from './uat-access.mjs';

import { redactSensitiveSmokeText, truncateForConsole } from './smoke-core';

const ignoredConsoleIssuePatterns: readonly RegExp[] = [
  /Response was blocked by CORB \(Cross-Origin Read Blocking\)/i,
  // Intermittent from embedded YouTube players; the site itself never requests Compute Pressure.
  /Permissions policy violation: compute-pressure is not allowed in this document/i,
];

export async function authenticateUatBrowser(context: BrowserContext, siteUrl: string): Promise<void> {
  const headers = uatAccessHeaders(siteUrl);
  if (!Object.keys(headers).length) return;
  const origin = new URL(siteUrl).origin;
  await context.route(`${origin}/**`, async (route) => {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        // Fulfill a single hop, so redirects to Stripe or another origin never inherit the service token.
        const response = await route.fetch({ headers: { ...route.request().headers(), ...headers }, maxRedirects: 0 });
        await route.fulfill({ response });
        return;
      } catch (error) {
        if (attempt === 0 && /ECONNRESET|ECONNREFUSED|socket hang up|timed?\s*out/i.test(String(error))) {
          await new Promise((resolve) => setTimeout(resolve, 250));
          continue;
        }
        // Let the browser try without token headers, which would also follow cross-origin redirects.
        await route.continue().catch(() => undefined);
        return;
      }
    }
  });
}

export type SmokePageDiagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
  dispose: () => void;
};

export type SmokeRouteProbe = {
  bodyText: string;
  issues: string[];
  status: number | null;
  title: string | null;
  url: string;
};

export function attachSmokePageDiagnostics(page: Page): SmokePageDiagnostics {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  const handleConsole = (message: ConsoleMessage) => {
    if (message.type() !== 'error') {
      return;
    }

    const text = redactSensitiveSmokeText(truncateForConsole(message.text()));

    if (ignoredConsoleIssuePatterns.some((pattern) => pattern.test(text))) {
      return;
    }

    consoleErrors.push(text);
  };

  const handlePageError = (error: Error) => {
    pageErrors.push(redactSensitiveSmokeText(truncateForConsole(error.stack || error.message || String(error))));
  };

  page.on('console', handleConsole);
  page.on('pageerror', handlePageError);

  return {
    consoleErrors,
    pageErrors,
    dispose() {
      page.off('console', handleConsole);
      page.off('pageerror', handlePageError);
    },
  };
}

export async function captureSmokePageScreenshot(
  page: Page,
  screenshotPath: string | null,
  fullPage = true,
): Promise<string | null> {
  if (!screenshotPath) {
    return null;
  }

  await page.screenshot({ fullPage, path: screenshotPath });

  return screenshotPath;
}

export async function probeSmokeRoute(page: Page, routeUrl: string, timeoutMs: number): Promise<SmokeRouteProbe> {
  const issues: string[] = [];
  let status: number | null = null;

  try {
    const response = await page.goto(routeUrl, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    });
    status = response?.status() ?? null;
    await page
      .waitForLoadState('networkidle', {
        timeout: Math.min(timeoutMs, 5_000),
      })
      .catch(() => undefined);
  } catch (error) {
    issues.push(redactSensitiveSmokeText(truncateForConsole(String(error))));
  }

  const title = await page
    .locator('title')
    .textContent({ timeout: timeoutMs })
    .catch(() => null);
  let bodyText = '';

  try {
    bodyText = await readSmokePageText(page, timeoutMs);
  } catch (error) {
    issues.push(redactSensitiveSmokeText(truncateForConsole(String(error))));
  }

  return {
    bodyText,
    issues,
    status,
    title,
    url: page.url() || routeUrl,
  };
}

export async function readSmokePageText(page: Page, timeoutMs: number): Promise<string> {
  return page.locator('body').innerText({ timeout: timeoutMs });
}
