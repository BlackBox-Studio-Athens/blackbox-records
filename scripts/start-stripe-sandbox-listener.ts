import { spawn } from 'node:child_process';
import process from 'node:process';

const sandboxWebhookUrl =
  'https://blackbox-records-backend-sandbox.blackboxrecordsathens.workers.dev/api/stripe/webhooks';

let reportedTemporarySecret = false;

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

  if (secret && !reportedTemporarySecret) {
    reportedTemporarySecret = true;
    console.log(
      'Temporary Stripe CLI listener signing secret detected and redacted. It was not synced to the sandbox Worker; persistent deployed-sandbox readiness uses the Dashboard/Workbench endpoint secret.',
    );
  }

  const sanitized = chunk.replace(/whsec_[A-Za-z0-9_]+/g, '[redacted_stripe_webhook_secret]');

  if (sanitized.trim()) {
    process.stdout.write(sanitized);
  }
}
