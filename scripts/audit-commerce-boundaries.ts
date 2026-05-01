import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

type TextCheck = {
  readonly label: string;
  readonly pattern: RegExp;
};

type Violation = {
  readonly file: string;
  readonly check: string;
  readonly detail: string;
};

const root = process.cwd();

const browserFacingRoots = ['apps/web/src', 'packages/api-client/src/generated/public'];

const publicContractFiles = [
  'apps/backend/openapi/public-openapi.json',
  'packages/api-client/src/generated/public/schema.ts',
];

const textExtensions = new Set(['.astro', '.css', '.js', '.json', '.mjs', '.ts', '.tsx']);

const browserFacingChecks: readonly TextCheck[] = [
  {
    label: 'server-only Stripe secret binding',
    pattern: /\bSTRIPE_SECRET_KEY\b/,
  },
  {
    label: 'server-only Stripe webhook secret binding',
    pattern: /\bSTRIPE_WEBHOOK_SECRET\b/,
  },
  {
    label: 'raw Stripe secret key value',
    pattern: /\bsk_test_[A-Za-z0-9_]+\b/,
  },
  {
    label: 'raw Stripe webhook secret value',
    pattern: /\bwhsec_[A-Za-z0-9_]+\b/,
  },
  {
    label: 'raw Stripe price identifier',
    pattern: /\bprice_[A-Za-z0-9_]+\b/,
  },
  {
    label: 'Stripe price mapping field',
    pattern: /\bstripePriceId\b/,
  },
  {
    label: 'D1 binding name',
    pattern: /\bCOMMERCE_DB\b/,
  },
  {
    label: 'D1 database binding config',
    pattern: /\bdatabase_id\b/,
  },
  {
    label: 'backend package import',
    pattern: /(?:from\s+["']@blackbox\/backend["']|import\(["']@blackbox\/backend["']\))/,
  },
  {
    label: 'backend runtime path',
    pattern: /(?:apps[\\/]+backend|src[\\/]+generated[\\/]+prisma)/,
  },
];

const publicContractChecks: readonly TextCheck[] = [
  {
    label: 'internal API path in public contract',
    pattern: /\/api\/internal\b/,
  },
  {
    label: 'internal stock/order schema in public contract',
    pattern: /\b(?:Internal[A-Za-z0-9_]*|StockChange|StockCount|actor_email)\b/,
  },
  {
    label: 'server-only Stripe secret binding in public contract',
    pattern: /\b(?:STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)\b/,
  },
  {
    label: 'raw Stripe secret value in public contract',
    pattern: /\b(?:sk_test_|whsec_)[A-Za-z0-9_]+\b/,
  },
  {
    label: 'raw Stripe price identifier in public contract',
    pattern: /\bprice_[A-Za-z0-9_]+\b/,
  },
  {
    label: 'backend runtime field in public contract',
    pattern: /\b(?:COMMERCE_DB|database_id|stripePriceId)\b/,
  },
];

const violations: Violation[] = [];

function toRelativePath(filePath: string): string {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

function shouldSkipFile(filePath: string): boolean {
  const relativePath = toRelativePath(filePath);

  return (
    relativePath.includes('/__snapshots__/') ||
    /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(relativePath) ||
    relativePath.endsWith('.d.ts')
  );
}

async function collectFiles(entryPath: string): Promise<string[]> {
  const absolutePath = path.join(root, entryPath);
  const entryStats = await stat(absolutePath);

  if (entryStats.isFile()) {
    return shouldSkipFile(absolutePath) ? [] : [absolutePath];
  }

  const directoryEntries = await readdir(absolutePath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    directoryEntries.map(async (entry) => {
      const childPath = path.join(entryPath, entry.name);

      if (entry.isDirectory()) {
        return collectFiles(childPath);
      }

      const absoluteChildPath = path.join(root, childPath);

      if (!entry.isFile() || shouldSkipFile(absoluteChildPath) || !textExtensions.has(path.extname(entry.name))) {
        return [];
      }

      return [absoluteChildPath];
    }),
  );

  return nestedFiles.flat();
}

function recordMatches(filePath: string, contents: string, checks: readonly TextCheck[]): void {
  for (const check of checks) {
    const match = check.pattern.exec(contents);

    if (!match) {
      continue;
    }

    violations.push({
      file: toRelativePath(filePath),
      check: check.label,
      detail: match[0],
    });
  }
}

async function auditBrowserFacingCode(): Promise<number> {
  const files = (await Promise.all(browserFacingRoots.map(collectFiles))).flat();

  for (const file of files) {
    recordMatches(file, await readFile(file, 'utf8'), browserFacingChecks);
  }

  return files.length;
}

async function auditPublicContracts(): Promise<void> {
  for (const contractFile of publicContractFiles) {
    const absolutePath = path.join(root, contractFile);
    const contents = await readFile(absolutePath, 'utf8');

    recordMatches(absolutePath, contents, publicContractChecks);

    if (contractFile.endsWith('.json')) {
      const document = JSON.parse(contents) as {
        readonly paths?: Record<string, unknown>;
      };

      for (const apiPath of Object.keys(document.paths ?? {})) {
        if (apiPath.startsWith('/api/internal')) {
          violations.push({
            file: toRelativePath(absolutePath),
            check: 'internal API path in public OpenAPI paths',
            detail: apiPath,
          });
        }
      }
    }
  }
}

async function main(): Promise<void> {
  const scannedFileCount = await auditBrowserFacingCode();
  await auditPublicContracts();

  if (violations.length > 0) {
    console.error('Commerce boundary audit failed:');

    for (const violation of violations) {
      console.error(`- ${violation.file}: ${violation.check} (${violation.detail})`);
    }

    process.exitCode = 1;
    return;
  }

  console.log(`Commerce boundary audit passed (${scannedFileCount} browser-facing files scanned).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
