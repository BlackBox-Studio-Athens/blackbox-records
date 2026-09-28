import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { checkAgentGuidance } from './check-agent-guidance.mjs';

async function fixture(files, run) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), 'agent-guidance-'));
  try {
    for (const [name, contents] of Object.entries(files)) {
      const file = path.join(cwd, name);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, contents);
    }
    return await run(cwd);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}

const packageJson = JSON.stringify({ scripts: { validate: 'node validate.mjs', 'test:unit': 'node test.mjs' } });

test('accepts existing relative links and known root scripts', async () => {
  const diagnostics = await fixture(
    {
      'package.json': packageJson,
      'AGENTS.md':
        '# Guidance\nSee [workflow](docs/agent-workflow.md).\nRun `pnpm validate` and `pnpm run test:unit`.\nExamples: `mode: local`, `prisma migrate deploy`, `object-fit: contain`.\n\n```sh\npnpm install\npnpm exec node --version\n```\n',
      'docs/agent-workflow.md': 'See [reference](agent%20reference.md#top) and [root](../AGENTS.md#top).\n',
      'docs/agent-reference.md': '# Reference\n',
      'docs/agent reference.md': '# Reference\n',
    },
    (cwd) => checkAgentGuidance({ cwd }),
  );
  assert.deepEqual(diagnostics, []);
});

test('reports missing links and unknown scripts with line and remediation', async () => {
  const diagnostics = await fixture(
    {
      'package.json': packageJson,
      'docs/agent-workflow.md':
        '# Workflow\n\nSee [missing](../missing.md).\n\nRun `pnpm no-such-script`.\n\n```sh\npnpm no-such-fenced-script\n```\n',
    },
    (cwd) => checkAgentGuidance({ cwd, documents: ['docs/agent-workflow.md'] }),
  );
  assert.match(diagnostics[0], /^docs\/agent-workflow\.md:3:.*missing\.md.*create the target or correct the link/);
  assert.match(
    diagnostics[1],
    /^docs\/agent-workflow\.md:5:.*no-such-script.*add it to package\.json or correct the command/,
  );
  assert.match(
    diagnostics[2],
    /^docs\/agent-workflow\.md:8:.*no-such-fenced-script.*add it to package\.json or correct the command/,
  );
});

test('skips external and fragment-only links', async () => {
  const diagnostics = await fixture(
    {
      'package.json': packageJson,
      'AGENTS.md':
        '[web](https://example.com) [email](mailto:team@example.com) [custom](scheme:value) [section](#here)\n`[code](missing.md)`\n',
    },
    (cwd) => checkAgentGuidance({ cwd, documents: ['AGENTS.md'] }),
  );
  assert.deepEqual(diagnostics, []);
});

test('fails usefully for missing documents and invalid package JSON', async () => {
  const missing = await fixture({ 'package.json': packageJson }, (cwd) =>
    checkAgentGuidance({ cwd, documents: ['docs/agent-workflow.md'] }),
  );
  assert.match(missing[0], /^docs\/agent-workflow\.md:1: cannot read document/);

  const invalid = await fixture(
    {
      'package.json': '{\n  invalid json\n}',
      'AGENTS.md': '# Guidance\n',
    },
    (cwd) => checkAgentGuidance({ cwd, documents: ['AGENTS.md'] }),
  );
  assert.match(invalid[0], /^package\.json:2: invalid JSON/);
});

test('enforces the AGENTS.md 120-line budget', async () => {
  const diagnostics = await fixture(
    {
      'package.json': packageJson,
      'AGENTS.md': `${Array.from({ length: 121 }, (_, index) => `line ${index + 1}`).join('\n')}\n`,
    },
    (cwd) => checkAgentGuidance({ cwd, documents: ['AGENTS.md'] }),
  );
  assert.match(
    diagnostics[0],
    /^AGENTS\.md:121: has 121 lines \(maximum 120\); move detail into linked guidance documents\./,
  );
});
