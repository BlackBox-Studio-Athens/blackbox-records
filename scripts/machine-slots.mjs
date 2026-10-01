import { mkdir, open, readFile, readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { loadPolicy, sharedStateDir } from './feedback-policy.mjs';

const pollMs = 250;
const unparseableGraceMs = 5000;
let ticketSequence = 0;

export function processAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

function directories(cwd, policy) {
  const root = sharedStateDir(cwd, policy);
  return { slots: path.join(root, 'slots'), queue: path.join(root, 'queue') };
}

async function entries(directory) {
  return (await readdir(directory).catch((error) => (error.code === 'ENOENT' ? [] : Promise.reject(error))))
    .filter((name) => name.endsWith('.json'))
    .sort();
}

async function remove(file) {
  await unlink(file).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
  });
}

/** Create `file` holding `record` unless it exists; false when another holder created it first. */
export async function createExclusive(file, record) {
  await mkdir(path.dirname(file), { recursive: true });
  let handle;
  try {
    handle = await open(file, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') return false;
    throw error;
  }
  try {
    await handle.writeFile(record);
  } finally {
    await handle.close();
  }
  return true;
}

/** The recorded holder of a slot, ticket or lock; a file whose process has exited is removed and yields null. */
export async function liveHolder(file) {
  let holder;
  try {
    holder = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    // An unparseable file is not stolen at once: its writer may sit between open and write.
    const modified = await stat(file).then(
      ({ mtimeMs }) => mtimeMs,
      () => null,
    );
    if (modified === null) return null;
    if (Date.now() - modified < unparseableGraceMs) return { pid: null, checkout: 'unknown', label: 'starting' };
  }
  if (Number.isSafeInteger(holder?.pid) && holder.pid > 0 && processAlive(holder.pid)) return holder;
  // ponytail: read-then-unlink can race a concurrent reclaim of the same file; acceptable for a few local runs.
  await remove(file);
  return null;
}

async function liveTickets(queue) {
  const live = [];
  for (const name of await entries(queue)) if (await liveHolder(path.join(queue, name))) live.push(name);
  return live;
}

function ticketName() {
  ticketSequence += 1;
  return `${[Date.now(), process.pid, ticketSequence].map((part) => String(part).padStart(15, '0')).join('-')}.json`;
}

/** Live slot holders across every checkout of this repository on the machine. */
export async function listSlots(cwd = process.cwd(), policy = loadPolicy()) {
  const { slots } = directories(cwd, policy);
  const holders = [];
  for (const name of await entries(slots)) {
    const holder = await liveHolder(path.join(slots, name));
    if (holder)
      holders.push({ pid: holder.pid, checkout: holder.checkout, label: holder.label, startedAt: holder.startedAt });
  }
  return holders;
}

function waitMessage(holders, ahead) {
  const held = holders.map(({ checkout, pid, label }) => `${checkout} (pid ${pid}, ${label})`).join(', ');
  return `Waiting for a validation slot; ${held ? `held by ${held}` : 'slots are being released'}${ahead > 0 ? `; ${ahead} queued ahead` : ''}.`;
}

/**
 * Take every free machine slot up to `want`. Without `min` free slots, either resolve with no slots
 * (`wait: false`) or queue behind earlier waiters until the oldest ticket can claim.
 */
export async function acquireSlots({
  cwd = process.cwd(),
  policy = loadPolicy(),
  want = policy.machine.slots,
  min = 1,
  wait = true,
  label = 'validation',
  signal,
  log = console.log,
} = {}) {
  signal?.throwIfAborted();
  const { slots, queue } = directories(cwd, policy);
  const record = JSON.stringify({
    pid: process.pid,
    checkout: path.resolve(cwd),
    label,
    startedAt: new Date().toISOString(),
  });
  const claimed = [];
  let ticket;
  const release = async () => {
    for (const file of claimed.splice(0)) await remove(file);
    if (ticket) await remove(ticket);
    ticket = undefined;
  };
  const claim = async () => {
    for (let index = 0; index < policy.machine.slots && claimed.length < want; index += 1) {
      const file = path.join(slots, `${index}.json`);
      if ((await createExclusive(file, record)) || (!(await liveHolder(file)) && (await createExclusive(file, record))))
        claimed.push(file);
    }
    if (claimed.length >= min) return true;
    for (const file of claimed.splice(0)) await remove(file);
    return false;
  };
  try {
    if (!(await liveTickets(queue)).length && (await claim())) return { count: claimed.length, release };
    if (!wait) return { count: 0, release: async () => {} };
    ticket = path.join(queue, ticketName());
    await createExclusive(ticket, record);
    let reportAt = 0;
    for (;;) {
      const position = (await liveTickets(queue)).indexOf(path.basename(ticket));
      // The shared state directory may be deleted at any time; rejoin at the same position.
      if (position < 0) await createExclusive(ticket, record);
      else if (position === 0 && (await claim())) {
        await remove(ticket);
        ticket = undefined;
        return { count: claimed.length, release };
      }
      if (Date.now() >= reportAt) {
        log(waitMessage(await listSlots(cwd, policy), position));
        reportAt = Date.now() + policy.machine.waitReportSeconds * 1000;
      }
      await sleep(pollMs, undefined, { signal });
    }
  } catch (error) {
    await release();
    throw error;
  }
}
