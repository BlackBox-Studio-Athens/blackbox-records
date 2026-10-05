import { execFileSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

type Hold = {
  id: string;
  checkoutSessionId: string;
  checkoutExpiresAt: string;
  paidAt: string | null;
  stripePaymentIntentId: string | null;
};
type StripeSession = {
  id: string;
  livemode: boolean;
  status: string;
  payment_status: string;
  metadata?: { orderId?: string };
  error?: { code?: string };
};
type D1Result = { success: boolean; results: Hold[]; meta: { changes: number } };
const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function queryUat(sql: string): D1Result {
  try {
    const output = execFileSync(
      process.execPath,
      [
        path.join(repoDir, 'apps/backend/node_modules/wrangler/bin/wrangler.js'),
        'd1',
        'execute',
        'blackbox-records-commerce-uat',
        '--config',
        path.join(repoDir, 'apps/backend/wrangler.jsonc'),
        '--env',
        'uat',
        '--remote',
        '--command',
        sql.replace(/\s+/g, ' ').trim(),
        '--json',
      ],
      { cwd: repoDir, encoding: 'utf8', windowsHide: true, timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const [result] = JSON.parse(output) as D1Result[];
    if (!result?.success || !Array.isArray(result.results)) throw new Error();
    return result;
  } catch {
    // Wrangler errors can contain private SQL and session references.
    throw new Error('UAT database operation failed; private output suppressed.');
  }
}

export async function expireUatCheckouts(args: string[], secretKey = process.env.STRIPE_SECRET_KEY) {
  const { values } = parseArgs({
    args: args.filter((arg) => arg !== '--'),
    options: {
      'variant-id': { type: 'string' },
      apply: { type: 'boolean', default: false },
      'retire-missing': { type: 'boolean', default: false },
    },
    strict: true,
    allowPositionals: false,
  });
  const variantId = values['variant-id'];
  if (!variantId || !/^[A-Za-z0-9_-]{1,200}$/.test(variantId)) throw new Error('A valid --variant-id is required.');
  if (!secretKey || !/^(sk|rk)_test_[A-Za-z0-9]+$/.test(secretKey) || secretKey.includes('mock')) {
    throw new Error('A real Stripe test-mode STRIPE_SECRET_KEY is required.');
  }

  const holds = queryUat(`SELECT id, checkoutSessionId, checkoutExpiresAt, paidAt, stripePaymentIntentId
    FROM CheckoutOrder WHERE status = 'pending_payment' AND checkoutSessionId IS NOT NULL
    AND EXISTS (SELECT 1 FROM CheckoutOrderLine WHERE orderId = CheckoutOrder.id
      AND variantId = ${sqlString(variantId)}) ORDER BY checkoutExpiresAt, id LIMIT 26`).results;
  if (holds.length > 25) throw new Error('More than 25 matching checkouts; narrow the test reset before proceeding.');
  const report = {
    environment: 'UAT',
    mode: values.apply ? 'apply' : 'dry-run',
    found: holds.length,
    plannedExpiry: 0,
    plannedRelease: 0,
    plannedReview: 0,
    expired: 0,
    released: 0,
    reviewed: 0,
    skipped: 0,
    conflicts: 0,
  };

  async function stripe(sessionId: string, expire = false) {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}${expire ? '/expire' : ''}`,
      {
        method: expire ? 'POST' : 'GET',
        headers: { Authorization: `Bearer ${secretKey}` },
        signal: AbortSignal.timeout(5000),
      },
    );
    return { ok: response.ok, httpStatus: response.status, session: (await response.json()) as StripeSession };
  }

  for (const hold of holds) {
    if (!/^cs_test_[A-Za-z0-9_]+$/.test(hold.checkoutSessionId) || hold.paidAt || hold.stripePaymentIntentId) {
      report.skipped++;
      continue;
    }
    let review = false;
    try {
      const read = await stripe(hold.checkoutSessionId);
      if (!read.ok) {
        if (
          read.httpStatus !== 404 ||
          read.session.error?.code !== 'resource_missing' ||
          !values['retire-missing'] ||
          !(Date.parse(hold.checkoutExpiresAt) < Date.now())
        ) {
          report.skipped++;
          continue;
        }
        // Explicit UAT reset quarantines unknown history; it does not assert nonpayment.
        review = true;
        report.plannedReview++;
      } else {
        const valid = (session: StripeSession) =>
          session.id === hold.checkoutSessionId &&
          session.livemode === false &&
          session.metadata?.orderId === hold.id &&
          session.payment_status === 'unpaid';
        if (!valid(read.session) || !['open', 'expired'].includes(read.session.status)) {
          report.skipped++;
          continue;
        }
        if (read.session.status === 'open') {
          report.plannedExpiry++;
          if (values.apply) {
            const closed = await stripe(hold.checkoutSessionId, true);
            if (!closed.ok || !valid(closed.session) || closed.session.status !== 'expired') {
              report.skipped++;
              continue;
            }
            report.expired++;
          }
        }
        report.plannedRelease++;
      }
    } catch {
      report.skipped++;
      continue;
    }
    if (!values.apply) continue;
    const now = sqlString(new Date().toISOString());
    const changes = queryUat(`UPDATE CheckoutOrder SET status = '${review ? 'needs_review' : 'not_paid'}',
      ${review ? `needsReviewAt = ${now}` : `notPaidAt = ${now}`},
      statusUpdatedAt = ${now}, updatedAt = ${now}
      WHERE id = ${sqlString(hold.id)} AND checkoutSessionId = ${sqlString(hold.checkoutSessionId)}
      AND status = 'pending_payment' AND paidAt IS NULL AND stripePaymentIntentId IS NULL`).meta.changes;
    if (changes === 1) {
      if (review) report.reviewed++;
      else report.released++;
    } else report.conflicts++;
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--help')) {
    console.log(
      'Usage: pnpm checkout:expire:uat -- --variant-id <variant> [--apply] [--retire-missing]\nDry-run by default. Requires STRIPE_SECRET_KEY (test mode). Mixed carts expire together.\n--retire-missing quarantines overdue missing test sessions as needs_review.',
    );
  } else {
    expireUatCheckouts(process.argv.slice(2))
      .then((report) => console.log(JSON.stringify(report, null, 2)))
      .catch((error: unknown) => {
        console.error(error instanceof Error ? error.message : 'UAT test reset failed.');
        process.exitCode = 1;
      });
  }
}
