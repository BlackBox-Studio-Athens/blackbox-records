import type { ConsoleMessage, Page } from 'playwright';

import { redactSensitiveSmokeText, truncateForConsole } from './smoke-core';

const ignoredConsoleIssuePatterns: readonly RegExp[] = [/Response was blocked by CORB \(Cross-Origin Read Blocking\)/i];

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

  const title = await page.title().catch(() => null);
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
