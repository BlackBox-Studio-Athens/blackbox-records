import { execFileSync } from 'node:child_process';
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tiers = ['iterate', 'complete', 'release', 'operational'];

/** The committed policy is the only source of feedback-loop rules; scripts and hooks read it here. */
export function loadPolicy(root = repositoryRoot) {
  const policy = JSON.parse(readFileSync(path.join(root, 'feedback-policy.json'), 'utf8'));
  if (policy.version !== 1) throw new Error(`Unsupported feedback policy version: ${policy.version}`);
  if (!Number.isInteger(policy.machine?.slots) || policy.machine.slots < 1)
    throw new Error('Feedback policy machine.slots must be a positive integer.');
  const seen = new Map();
  for (const tier of tiers) {
    for (const name of policy.commands?.[tier] ?? []) {
      if (seen.has(name)) throw new Error(`Feedback policy classifies ${name} as both ${seen.get(name)} and ${tier}.`);
      seen.set(name, tier);
    }
  }
  for (const rule of policy.deny ?? []) {
    if (!rule.id || !rule.pattern || !rule.instead)
      throw new Error('Every feedback policy deny rule needs id, pattern and instead.');
    new RegExp(rule.pattern);
    if (rule.unless) new RegExp(rule.unless);
  }
  for (const { unless } of Object.values(policy.guardedScripts ?? {})) if (unless) new RegExp(unless);
  return policy;
}

/** Tier of a root package command, or undefined when the policy does not classify it. */
export function commandTier(policy, name) {
  return tiers.find((tier) => policy.commands[tier]?.includes(name));
}

/**
 * State shared by every checkout of this repository on the machine. The git common directory is the
 * primary checkout's `.git` from every linked worktree, so slots, leases and grants need no configuration.
 */
export function sharedStateDir(cwd = process.cwd(), policy = loadPolicy()) {
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
  const directory = path.join(common, policy.sharedState.directory);
  mkdirSync(directory, { recursive: true });
  return directory;
}

export function grantPath(cwd = process.cwd(), policy = loadPolicy()) {
  return path.join(sharedStateDir(cwd, policy), policy.releaseTier.grantFile);
}

/** Machine-wide feedback history: shared by every checkout, kept after worktree removal and never committed. */
export function historyPath(cwd = process.cwd(), policy = loadPolicy()) {
  return path.join(sharedStateDir(cwd, policy), policy.history.file);
}

/** Appends one JSON line to the history. Best-effort: history must never fail the work it records. */
export function appendHistory(record, options = {}) {
  try {
    const { cwd = process.cwd(), policy = loadPolicy(), now = Date.now() } = options;
    const entry = { time: new Date(now).toISOString(), checkout: path.resolve(cwd), ...record };
    appendFileSync(historyPath(cwd, policy), `${JSON.stringify(entry)}\n`);
  } catch {
    // An unreadable policy, a cwd outside a git checkout or a failed write leaves the history without this entry.
  }
}

/** A missing, malformed or expired grant is absent; only a future expiry counts. */
export function readGrant(cwd = process.cwd(), { policy = loadPolicy(), now = Date.now() } = {}) {
  try {
    const expiresAt = Date.parse(JSON.parse(readFileSync(grantPath(cwd, policy), 'utf8')).expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > now
      ? { active: true, expiresAt: new Date(expiresAt).toISOString() }
      : { active: false };
  } catch {
    return { active: false };
  }
}

/** Release-tier work runs in CI, under the maintainer's override variable, or under an active grant. */
export function releaseTierAllowance({
  env = process.env,
  cwd = process.cwd(),
  policy = loadPolicy(),
  now = Date.now(),
} = {}) {
  if (env.GITHUB_ACTIONS === 'true') return { allowed: true, reason: 'ci' };
  if (env[policy.releaseTier.overrideEnv] === '1') return { allowed: true, reason: 'override' };
  const grant = readGrant(cwd, { policy, now });
  return grant.active
    ? { allowed: true, reason: 'grant', expiresAt: grant.expiresAt }
    : { allowed: false, reason: 'none' };
}
