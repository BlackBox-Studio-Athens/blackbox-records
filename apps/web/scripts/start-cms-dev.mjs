import { dev } from 'astro';

process.env.ASTRO_DEV_BACKGROUND = '0';
process.env.SVELTIA_BACKEND_MODE = 'local';
delete process.env.SVELTIA_AUTH_BASE_URL;

const server = await dev({
  root: new URL('../', import.meta.url),
  server: { host: '127.0.0.1', port: 4322 },
  vite: { server: { strictPort: true } },
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    void server.stop().catch(() => {
      process.exitCode = 1;
    });
  });
}
