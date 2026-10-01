import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromeLeasePath, readChromeLease } from './agent-hooks/browser-lease.mjs';
import { loadPolicy, readGrant } from './feedback-policy.mjs';
import { checkoutOf, sitePortRegistry, stackLease } from './local-resources.mjs';
import { listSlots, processAlive } from './machine-slots.mjs';

function listening(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port, timeout: 500 });
    const settle = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.once('connect', () => settle(true));
    socket.once('timeout', () => settle(false));
    socket.once('error', () => settle(false));
  });
}

const seconds = (ms) => `${Math.round(ms / 1000)} s`;

/** Who holds the machine's shared local resources for this repository; changes nothing it reports. */
export async function localStatus(
  cwd = process.cwd(),
  { policy = loadPolicy(), now = Date.now(), probe = listening } = {},
) {
  const lines = [];
  const slots = await listSlots(cwd, policy);
  lines.push(`Validation slots: ${slots.length} of ${policy.machine.slots} held`);
  for (const { checkout, pid, label, startedAt } of slots)
    lines.push(`  ${checkout} (pid ${pid}, ${label}, since ${startedAt})`);

  lines.push('Site ports:');
  const primary = [checkoutOf(cwd).worktrees[0], policy.localResources.sitePort.primary];
  for (const [checkout, port] of [primary, ...Object.entries(sitePortRegistry(cwd, policy))])
    lines.push(`  ${port} ${(await probe(port)) ? 'listening' : 'free'} ${checkout}`);

  const stack = stackLease(cwd, policy);
  const running = Number.isSafeInteger(stack?.pid) && processAlive(stack.pid);
  lines.push(
    `Full Local stack: ${
      running
        ? `${stack.checkout} (pid ${stack.pid}, since ${stack.startedAt})`
        : `not running${stack ? ` (stale lease from ${stack.checkout})` : ''}`
    }`,
  );

  const chrome = readChromeLease(chromeLeasePath(cwd, policy));
  const idle = now - Date.parse(chrome?.renewedAt);
  const idleMs = policy.localResources.chromeLeaseIdleSeconds * 1000;
  lines.push(
    `Chrome lease: ${
      idle < idleMs
        ? `${chrome.checkout} (session ${chrome.sessionId}, last used ${seconds(idle)} ago, free in at most ${seconds(idleMs - idle)})`
        : `free${chrome ? ` (last used from ${chrome.checkout})` : ''}`
    }`,
  );

  const grant = readGrant(cwd, { policy, now });
  lines.push(`Maintainer grant: ${grant.active ? `active until ${grant.expiresAt}` : 'none'}`);
  return lines.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  console.log(await localStatus());
