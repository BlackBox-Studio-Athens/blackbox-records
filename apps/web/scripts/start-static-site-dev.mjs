import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { sitePort } from '../../../scripts/local-resources.mjs';

const HOST = '127.0.0.1';
const SITE_PATH = '/blackbox-records/';
const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const background = process.argv.includes('--background');
const astroEnv = background ? process.env : { ...process.env, ASTRO_DEV_BACKGROUND: '0' };

function assertPortAvailable(host, port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once('error', (error) => {
      server.close();

      if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${port} is already in use on ${host}. Stop the existing BlackBox static-site dev server and retry. Expected local URL: http://${host}:${port}${SITE_PATH}`,
          ),
        );
        return;
      }

      reject(error);
    });

    server.once('listening', () => {
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }

        resolve();
      });
    });

    server.listen(port, host);
  });
}

function spawnAstroDev(port) {
  const astroCommand = path.join(webDir, 'node_modules', '.bin', process.platform === 'win32' ? 'astro.CMD' : 'astro');
  const args = [
    process.argv.includes('--preview') ? 'preview' : 'dev',
    '--root',
    '.',
    '--host',
    HOST,
    '--port',
    String(port),
    ...(background ? ['--background'] : []),
  ];

  if (process.platform === 'win32') {
    const commandString = `"${astroCommand}" ${args.join(' ')}`;

    return spawn(commandString, [], {
      cwd: webDir,
      stdio: 'inherit',
      env: astroEnv,
      shell: true,
      windowsHide: true,
    });
  }

  return spawn(astroCommand, args, {
    cwd: webDir,
    stdio: 'inherit',
    env: astroEnv,
    windowsHide: true,
  });
}

// 4321 in the primary checkout and in the checkout holding the full stack's lease, whose publication runtime binds
// it; otherwise this linked worktree's assigned port. strictPort keeps Astro from moving to another port.
// --background skips the pre-check: Astro reports this checkout's running background server and exits 0, and
// strictPort still fails it on a port that another process holds.
let port;
try {
  port = sitePort(webDir);
  if (!background) await assertPortAvailable(HOST, port);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

if (!background && process.env.CMS_LOCAL_PUBLICATION === '1') {
  const { startLocalPublication } = await import('./start-local-publication.mjs');
  await startLocalPublication();
} else {
  const astroProcess = spawnAstroDev(port);

  const forwardSignal = (signal) => {
    if (!astroProcess.killed) {
      astroProcess.kill(signal);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  astroProcess.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}
