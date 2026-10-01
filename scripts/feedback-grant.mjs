import { rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grantPath, loadPolicy, readGrant } from './feedback-policy.mjs';

/**
 * The maintainer's switch for release-tier work: `<minutes>` issues a grant shared by every checkout,
 * `--revoke` removes it and no argument prints it. The agent hooks deny this command; the environment
 * check below is the second line for a shell an agent tool started.
 */
export function main(
  args = process.argv.slice(2),
  { env = process.env, cwd = process.cwd(), now = Date.now(), policy = loadPolicy() } = {},
) {
  const { maxGrantMinutes, agentEnvMarkers } = policy.releaseTier;
  const [request, ...extra] = args.filter((arg) => arg !== '--');
  const usage = `Usage: pnpm feedback:grant-full <minutes, 1-${maxGrantMinutes}> | --revoke`;
  if (extra.length) {
    console.error(usage);
    return 1;
  }
  if (request === undefined) {
    const grant = readGrant(cwd, { policy, now });
    console.log(grant.active ? `Release-tier grant active until ${grant.expiresAt}.` : 'No active release-tier grant.');
    return 0;
  }
  if (request === '--revoke') {
    rmSync(grantPath(cwd, policy), { force: true });
    console.log('Release-tier grant revoked.');
    return 0;
  }
  const marker = agentEnvMarkers.find((name) => env[name]);
  if (marker) {
    console.error(`Refusing to issue a release-tier grant: ${marker} shows that an agent tool started this command.`);
    return 1;
  }
  const minutes = Number(request);
  if (!/^\d+$/.test(request) || minutes < 1 || minutes > maxGrantMinutes) {
    console.error(usage);
    return 1;
  }
  const expiresAt = new Date(now + minutes * 60_000).toISOString();
  writeFileSync(grantPath(cwd, policy), `${JSON.stringify({ grantedAt: new Date(now).toISOString(), expiresAt })}\n`);
  console.log(`Release-tier grant active until ${expiresAt} for every checkout of this repository.`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
