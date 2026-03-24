import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const decapServerExecutable = resolve(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'decap-server.cmd' : 'decap-server',
);

const child = spawn(decapServerExecutable, {
  cwd: projectRoot,
  env: {
    ...process.env,
    PORT: process.env.DECAP_LOCAL_PROXY_PORT ?? '8082',
  },
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill();
    }
  });
}
