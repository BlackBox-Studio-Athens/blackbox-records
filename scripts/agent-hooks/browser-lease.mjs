import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPolicy, sharedStateDir } from '../feedback-policy.mjs';

export function chromeLeasePath(cwd = process.cwd(), policy = loadPolicy()) {
  return path.join(sharedStateDir(cwd, policy), 'chrome.lease');
}

export function readChromeLease(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

async function ownSiteUrl(cwd, policy) {
  try {
    const { siteUrl } = await import('../local-resources.mjs');
    return siteUrl(cwd, policy);
  } catch {
    return "this checkout's own site port (`pnpm local:status`)";
  }
}

// The lease belongs to this repository's shared state, wherever a session's working directory has moved.
const projectRoot =
  process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Claude Code PreToolUse hook for the Chrome tools: one agent session uses the shared Chrome profile at a time.
 * Use renews the lease; a lease idle for the policy's time is free. A missing or malformed lease is free.
 */
export async function decideChromeLease(event, { policy = loadPolicy(), now = Date.now(), root = projectRoot } = {}) {
  const file = chromeLeasePath(root, policy);
  const lease = readChromeLease(file);
  const idleMs = policy.localResources.chromeLeaseIdleSeconds * 1000;
  const idle = now - Date.parse(lease?.renewedAt);
  if (lease && lease.sessionId !== event.session_id && idle < idleMs) {
    const ago = Math.max(0, Math.round(idle / 1000));
    const left = Math.ceil((idleMs - idle) / 1000);
    return {
      allowed: false,
      message: `Chrome is leased to another agent session in ${lease.checkout} (last used ${ago} s ago; free in at most ${left} s). Instead run a named spec with \`pnpm test:e2e e2e/<spec>.spec.ts\`, or use the built-in browser pane on ${await ownSiteUrl(event.cwd, policy)}.`,
    };
  }
  // ponytail: two sessions taking a free lease at the same instant both pass once; the next call denies the loser.
  const temporary = `${file}.${process.pid}.tmp`;
  writeFileSync(
    temporary,
    JSON.stringify({
      sessionId: event.session_id,
      checkout: path.resolve(event.cwd),
      renewedAt: new Date(now).toISOString(),
    }),
  );
  renameSync(temporary, file);
  return { allowed: true };
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const event = JSON.parse(input);
  if (typeof event?.session_id !== 'string' || typeof event.cwd !== 'string')
    throw new Error('hook input lacks session_id or cwd');
  const decision = await decideChromeLease(event);
  if (!decision.allowed) {
    process.stderr.write(`${decision.message}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  // It coordinates access and is no safety control, so any failure lets the tool call through.
  main().catch((error) => {
    const reason = String(error instanceof Error ? error.message : error).split(/\r?\n/)[0];
    process.stderr.write(`Chrome lease hook skipped: ${reason}\n`);
    process.exitCode = 0;
  });
