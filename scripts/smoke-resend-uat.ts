import { mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  createRunId,
  createSmokeEvidencePath,
  createSmokeSummaryPath,
  normalizeBaseUrl,
  parsePositiveInteger,
  parseRequiredValue,
  redactSensitiveSmokeText,
  truncateForConsole,
  writeJsonFile,
} from './smoke-core';

export type ResendUatSmokeOptions = {
  evidenceDir: string;
  timeoutMs: number;
  workerUrl: string;
};

export type ResendUatSmokeCheckKind = 'newsletter-registration' | 'worker-health';

export type ResendUatSmokeCheck = {
  bodyTextSnippet: string | null;
  contentType: string | null;
  issues: string[];
  kind: ResendUatSmokeCheckKind;
  path: string;
  status: number | null;
  url: string;
};

export type ResendUatSmokeEvidence = {
  checks: ResendUatSmokeCheck[];
  environment: 'uat';
  generatedAt: string;
  runId: string;
  status: 'failed' | 'passed';
  suite: 'resend-uat';
  summary: string;
  workerUrl: string;
};

export type ResendUatSmokeSummary = {
  environment: 'uat';
  generatedAt: string;
  runId: string;
  status: 'failed' | 'passed';
  suite: 'resend-uat';
  workerUrl: string;
};

const defaultWorkerUrl = 'https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev';
const defaultEvidenceDir = path.join('.codex-artifacts', 'smoke', 'uat', 'resend-uat');
const uatSiteOrigin = 'https://blackbox-studio-athens.github.io';

export function parseResendUatSmokeArgs(args: string[]): ResendUatSmokeOptions {
  const options: ResendUatSmokeOptions = {
    evidenceDir: defaultEvidenceDir,
    timeoutMs: 30_000,
    workerUrl: defaultWorkerUrl,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log('Usage: pnpm smoke:resend-uat -- [--worker-url <url>] [--timeout-ms <ms>] [--evidence-dir <dir>]');
      process.exit(0);
    }

    if (arg === '--worker-url') {
      options.workerUrl = normalizeBaseUrl(parseRequiredValue('--worker-url', args[index + 1]), '--worker-url');
      index += 1;
      continue;
    }

    if (arg?.startsWith('--worker-url=')) {
      options.workerUrl = normalizeBaseUrl(arg.slice('--worker-url='.length), '--worker-url');
      continue;
    }

    if (arg === '--timeout-ms') {
      options.timeoutMs = parsePositiveInteger(args[index + 1], '--timeout-ms');
      index += 1;
      continue;
    }

    if (arg?.startsWith('--timeout-ms=')) {
      options.timeoutMs = parsePositiveInteger(arg.slice('--timeout-ms='.length), '--timeout-ms');
      continue;
    }

    if (arg === '--evidence-dir') {
      options.evidenceDir = parseRequiredValue('--evidence-dir', args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--evidence-dir=')) {
      options.evidenceDir = parseRequiredValue('--evidence-dir', arg.slice('--evidence-dir='.length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function createResendUatSmokeEmail(runId: string): string {
  return `uat-resend-smoke+${runId}@blackbox.example`;
}

export async function runResendUatSmoke(options: ResendUatSmokeOptions): Promise<ResendUatSmokeEvidence> {
  const runId = createRunId();
  const runArtifactDir = path.join(options.evidenceDir, runId);
  mkdirSync(runArtifactDir, { recursive: true });

  const checks = [
    await checkWorkerHealth(options),
    await checkNewsletterRegistration(options, createResendUatSmokeEmail(runId)),
  ];
  const status = checks.some((check) => check.issues.length || check.status === null || check.status >= 400)
    ? 'failed'
    : 'passed';
  const evidence = buildResendUatSmokeEvidence({
    checks,
    runId,
    status,
    workerUrl: options.workerUrl,
  });

  writeJsonFile(createSmokeEvidencePath(runArtifactDir), evidence);
  writeJsonFile(createSmokeSummaryPath(runArtifactDir), buildResendUatSmokeSummary(evidence));

  return evidence;
}

export function buildResendUatSmokeEvidence(input: {
  checks: ResendUatSmokeCheck[];
  runId: string;
  status: ResendUatSmokeEvidence['status'];
  workerUrl: string;
}): ResendUatSmokeEvidence {
  const issueCount = input.checks.reduce((count, check) => count + check.issues.length, 0);

  return {
    checks: input.checks,
    environment: 'uat',
    generatedAt: new Date().toISOString(),
    runId: input.runId,
    status: input.status,
    suite: 'resend-uat',
    summary: [
      `Resend UAT smoke: ${input.status.toUpperCase()} (${issueCount} issue(s))`,
      `- checks: ${input.checks.length}`,
    ].join('\n'),
    workerUrl: input.workerUrl,
  };
}

export function buildResendUatSmokeSummary(evidence: ResendUatSmokeEvidence): ResendUatSmokeSummary {
  return {
    environment: 'uat',
    generatedAt: evidence.generatedAt,
    runId: evidence.runId,
    status: evidence.status,
    suite: 'resend-uat',
    workerUrl: evidence.workerUrl,
  };
}

async function checkWorkerHealth(options: ResendUatSmokeOptions): Promise<ResendUatSmokeCheck> {
  const pathName = '/api/store/capabilities';
  const url = `${options.workerUrl}${pathName}`;
  const issues: string[] = [];
  const response = await fetchSmokeResponse(url, options.timeoutMs).catch((error: unknown) => {
    issues.push(`Expected sandbox Worker health route to be reachable: ${redactSensitiveSmokeText(String(error))}.`);
    return null;
  });
  const bodyText = response ? await response.text() : '';
  const contentType = response?.headers.get('content-type') ?? null;

  if (response && !response.ok) {
    issues.push(`Expected sandbox Worker health route to return HTTP 200; received ${response.status}.`);
  }

  if (response?.ok && !bodyText.includes('nativeCheckout')) {
    issues.push('Expected sandbox Worker health route to return Store Capabilities JSON.');
  }

  return {
    bodyTextSnippet: truncateForConsole(redactSensitiveSmokeText(bodyText), 450),
    contentType,
    issues,
    kind: 'worker-health',
    path: pathName,
    status: response?.status ?? null,
    url,
  };
}

async function checkNewsletterRegistration(
  options: ResendUatSmokeOptions,
  email: string,
): Promise<ResendUatSmokeCheck> {
  const pathName = '/api/newsletter/registrations';
  const url = `${options.workerUrl}${pathName}`;
  const issues: string[] = [];
  const response = await fetchSmokeResponse(url, options.timeoutMs, {
    body: JSON.stringify({
      consentAccepted: true,
      email,
    }),
    headers: {
      'content-type': 'application/json',
      origin: uatSiteOrigin,
    },
    method: 'POST',
  }).catch((error: unknown) => {
    issues.push(`Expected UAT newsletter registration to be reachable: ${redactSensitiveSmokeText(String(error))}.`);
    return null;
  });
  const bodyText = response ? await response.text() : '';
  const contentType = response?.headers.get('content-type') ?? null;
  const cacheControl = response?.headers.get('cache-control') ?? null;

  if (response && response.status !== 200) {
    issues.push(`Expected UAT newsletter registration to return HTTP 200; received ${response.status}.`);
  }

  if (response && cacheControl !== 'no-store') {
    issues.push(`Expected UAT newsletter registration to return Cache-Control: no-store; received ${cacheControl}.`);
  }

  if (response?.ok && !isRegisteredNewsletterResponse(bodyText)) {
    issues.push('Expected UAT newsletter registration to return {"status":"registered"}.');
  }

  return {
    bodyTextSnippet: truncateForConsole(redactSensitiveSmokeText(bodyText), 450),
    contentType,
    issues,
    kind: 'newsletter-registration',
    path: pathName,
    status: response?.status ?? null,
    url,
  };
}

async function fetchSmokeResponse(url: string, timeoutMs: number, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isRegisteredNewsletterResponse(bodyText: string): boolean {
  try {
    const body = JSON.parse(bodyText) as { status?: unknown };

    return body.status === 'registered';
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const evidence = await runResendUatSmoke(parseResendUatSmokeArgs(process.argv.slice(2)));

  console.log(evidence.summary);
  console.log(JSON.stringify(evidence, null, 2));

  if (evidence.status === 'failed') {
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(redactSensitiveSmokeText(error instanceof Error ? error.stack || error.message : String(error)));
    process.exit(1);
  });
}
