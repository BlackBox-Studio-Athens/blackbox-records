import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandTier, loadPolicy, releaseTierAllowance } from './feedback-policy.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function refusal(command, policy) {
  return `\`${command}\` is release-tier work and needs a maintainer grant.\n${policy.releaseTier.instead}`;
}

/**
 * The `guardedScripts` entry a direct run of `script` with `args` falls under, or undefined. `script` is the path
 * as typed (relative, absolute or with backslashes); a focused mode the entry's `unless` matches is not guarded.
 */
export function guardedScript(policy, script, args) {
  const typed = script.replaceAll('\\', '/').toLowerCase();
  for (const [file, entry] of Object.entries(policy.guardedScripts ?? {})) {
    if (typed !== file.toLowerCase() && !typed.endsWith(`/${file.toLowerCase()}`)) continue;
    return entry.unless && new RegExp(entry.unless).test(args.join(' ')) ? undefined : { file, ...entry };
  }
}

/** Why a direct run of the listed leaf script `file` may not start, or undefined; anything unexpected refuses. */
export function scriptRefusal(
  file,
  { args = process.argv.slice(2), env = process.env, cwd = process.cwd(), now = Date.now() } = {},
) {
  try {
    const policy = loadPolicy();
    if (!policy.guardedScripts?.[file]) return `Feedback guard: ${file} is not listed in feedback-policy.json.`;
    const entry = guardedScript(policy, file, args);
    if (!entry || releaseTierAllowance({ env, cwd, policy, now }).allowed) return;
    return `Direct runs of ${file} belong to \`pnpm ${entry.command}\`, which is release-tier work and needs a maintainer grant.\n${policy.releaseTier.instead}`;
  } catch (error) {
    return `Feedback guard refused: ${error.message}`;
  }
}

/** Release-tier leaf scripts call this before any work: outside CI, the override or a grant the run stops here. */
export function guardScript(scriptUrl) {
  const script = fileURLToPath(scriptUrl);
  const message = scriptRefusal(path.relative(repositoryRoot, script).replaceAll(path.sep, '/'), {
    cwd: path.dirname(script),
  });
  if (!message) return;
  console.error(message);
  process.exit(1);
}

/**
 * Environment for the guarded child steps of a run the guard already admitted, so a grant that expires mid-run
 * cannot stop them. Repository scripts set it for their own children; agents setting it stays denied by the hook.
 */
export function admittedRunEnv(policy = loadPolicy()) {
  return { [policy.releaseTier.overrideEnv]: '1' };
}

/** The validation wrapper calls this before any work; release-tier modes need CI, the override or a grant. */
export function assertValidationAllowed(
  args,
  { policy = loadPolicy(), env = process.env, cwd = process.cwd(), now = Date.now() } = {},
) {
  const modes = args.filter((arg) => policy.releaseTier.validateModes.includes(arg));
  if (!modes.length) return;
  const allowance = releaseTierAllowance({ env, cwd, policy, now });
  if (!allowance.allowed) throw new Error(refusal(`pnpm validate ${modes.join(' ')}`, policy));
}

/** Whether arguments name the subset a filtered-only root command requires (a spec path or title filter). */
export function satisfiesFilter(name, args, policy = loadPolicy()) {
  const { commands, filter } = policy.filteredOnly;
  return !commands.includes(name) || new RegExp(filter).test(args.join(' '));
}

/** The whole-package suite a `<package>:<script>` guard name denotes in the policy, or undefined. */
export function packageSuite(policy, name) {
  for (const [packageName, scripts] of Object.entries(policy.packageSuites?.packages ?? {}))
    for (const script of scripts) if (name === `${packageName}:${script}`) return { packageName, script };
}

/**
 * Exit code for `node scripts/feedback-guard.mjs <root-command | package:script>`; anything unexpected refuses.
 * Whole-package suites also run inside Nx tasks, whose marker the command hook denies setting by hand.
 */
export function main(
  [name] = process.argv.slice(2),
  { env = process.env, cwd = process.cwd(), now = Date.now() } = {},
) {
  try {
    const policy = loadPolicy();
    const suite = name && packageSuite(policy, name);
    const tier = suite ? 'release' : name && commandTier(policy, name);
    if (!tier) {
      console.error(`Feedback guard: \`${name ?? ''}\` is unclassified in feedback-policy.json; classify it first.`);
      return 1;
    }
    if (tier !== 'release') return 0;
    if (suite && env[policy.packageSuites.nxTaskEnv]) return 0;
    const allowance = releaseTierAllowance({ env, cwd, policy, now });
    if (!allowance.allowed) {
      console.error(refusal(suite ? `pnpm --filter ${suite.packageName} ${suite.script}` : `pnpm ${name}`, policy));
      return 1;
    }
    if (allowance.reason === 'grant')
      console.log(`Release-tier run allowed by the maintainer grant until ${allowance.expiresAt}.`);
    return 0;
  } catch (error) {
    console.error(`Feedback guard refused: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
