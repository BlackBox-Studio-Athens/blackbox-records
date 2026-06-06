import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(webRoot, '..', '..');
const decapServerExecutable = resolve(
  webRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'decap-server.cmd' : 'decap-server',
);
const astroExecutable = resolve(webRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'astro.cmd' : 'astro');
const cmsPort = process.env.CMS_DEV_PORT ?? '4322';
const proxyPort = process.env.DECAP_LOCAL_PROXY_PORT ?? '8082';

const children = [
  spawn(decapServerExecutable, {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: proxyPort,
    },
    shell: process.platform === 'win32',
    stdio: 'inherit',
  }),
  spawn(astroExecutable, ['dev', '--port', cmsPort], {
    cwd: webRoot,
    env: process.env,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  }),
];

let shuttingDown = false;

function stopChildren(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(exitCode);
}

for (const child of children) {
  child.on('exit', (code) => {
    stopChildren(code ?? 0);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => stopChildren(0));
}
