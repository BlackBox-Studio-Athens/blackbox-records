import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const PORT = 4321;
const SITE_PATH = '/blackbox-records/';
const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

function spawnAstroDev() {
  const astroCommand = path.join(
    webDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'astro.CMD' : 'astro',
  );

  if (process.platform === 'win32') {
    const commandString = `"${astroCommand}" dev --root . --host ${HOST} --port ${PORT}`;

    return spawn(commandString, [], {
      cwd: webDir,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });
  }

  return spawn(
    astroCommand,
    ['dev', '--root', '.', '--host', HOST, '--port', String(PORT)],
    {
      cwd: webDir,
      stdio: 'inherit',
      env: process.env,
    },
  );
}

try {
  await assertPortAvailable(HOST, PORT);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const astroProcess = spawnAstroDev();

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
