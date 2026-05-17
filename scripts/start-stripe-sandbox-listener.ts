import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';

const sandboxWebhookUrl =
  'https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev/api/stripe/webhooks';
const backendDir = path.join(process.cwd(), 'apps', 'backend');
const nodeRequire = createRequire(import.meta.url);
const wranglerBin = nodeRequire.resolve('wrangler/bin/wrangler.js', { paths: [backendDir] });

let synced = false;

const stripe = spawn('stripe', ['listen', '--forward-to', sandboxWebhookUrl], {
  cwd: process.cwd(),
  shell: process.platform === 'win32',
  stdio: ['ignore', 'pipe', 'pipe'],
});

stripe.stdout.setEncoding('utf8');
stripe.stderr.setEncoding('utf8');

stripe.stdout.on('data', handleStripeOutput);
stripe.stderr.on('data', handleStripeOutput);

stripe.on('exit', (code, signal) => {
  console.log(`Stripe sandbox listener exited: code=${code ?? 'null'} signal=${signal ?? 'null'}`);
  process.exit(code ?? 0);
});

function handleStripeOutput(chunk: string) {
  const secret = /whsec_[A-Za-z0-9_]+/.exec(chunk)?.[0];

  if (secret && !synced) {
    synced = true;
    syncSandboxWebhookSecret(secret);
  }

  const sanitized = chunk.replace(/whsec_[A-Za-z0-9_]+/g, '[redacted_stripe_webhook_secret]');

  if (sanitized.trim()) {
    process.stdout.write(sanitized);
  }
}

function syncSandboxWebhookSecret(secret: string) {
  const result = spawnSync(
    process.execPath,
    [wranglerBin, 'secret', 'put', 'STRIPE_WEBHOOK_SECRET', '--env', 'sandbox'],
    {
      cwd: backendDir,
      encoding: 'utf8',
      input: secret,
      shell: false,
    },
  );

  if (result.error || result.status !== 0) {
    console.error('Failed to sync sandbox STRIPE_WEBHOOK_SECRET from active Stripe listener.');
    console.error(sanitize(result.stderr || result.stdout || String(result.error)));
    stripe.kill();
    process.exit(1);
  }

  console.log('Sandbox STRIPE_WEBHOOK_SECRET synced from active Stripe listener.');
}

function sanitize(text: string) {
  return text.replace(/whsec_[A-Za-z0-9_]+/g, '[redacted_stripe_webhook_secret]');
}
