import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { applyHookEvent } from './webstorm-workflow.mjs';

test('guidance limits WebStorm to large-scale refactoring and permits fallback', () => {
  for (const prompt of ['Refactor across modules.', 'Rename a function.', 'Keep going.']) {
    const context = applyHookEvent({ hook_event_name: 'UserPromptSubmit', prompt }).hookSpecificOutput
      .additionalContext;
    assert.match(context, /native apply_patch for ordinary edits/);
    assert.match(context, /WebStorm MCP only for large-scale refactoring/);
    assert.match(context, /rename_refactoring.*when available/);
    assert.match(context, /Missing patch\/delete tools.*do not block/);
    assert.match(context, /inspect any partial changes/);
    assert.doesNotMatch(context, /npm|pnpm|validation|run configurations/);
  }
});

test('legacy state, IDE failures, native edits and completion cannot create routing blocks', () => {
  const legacy = { renameRequired: true, refactorRequired: true, ideEdits: false };
  for (const event of [
    { hook_event_name: 'PreToolUse', tool_name: 'apply_patch' },
    {
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'Remove-Item -LiteralPath src/retired.ts' },
    },
    { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'npm test' } },
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__rename_refactoring',
      tool_response: { isError: true },
    },
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__webstorm__execute_tool',
      tool_response: { isError: false, content: [{ type: 'text', text: '1 operations failed' }] },
    },
    { hook_event_name: 'Stop' },
    { hook_event_name: 'Stop', stop_hook_active: true },
  ])
    assert.equal(applyHookEvent(event, legacy), null);
});

test('WebStorm hook registration is prompt-only and the CLI permits native fallback', () => {
  const config = JSON.parse(readFileSync(new URL('../hooks.json', import.meta.url), 'utf8'));
  assert.deepEqual(
    Object.entries(config.hooks).flatMap(([event, groups]) =>
      groups.flatMap(({ hooks }) =>
        hooks
          .filter(({ command, commandWindows }) =>
            [command, commandWindows].some((value) => value?.includes('webstorm-workflow.mjs')),
          )
          .map(() => event),
      ),
    ),
    ['UserPromptSubmit'],
  );
  const hook = fileURLToPath(new URL('./webstorm-workflow.mjs', import.meta.url));
  for (const event of [
    { hook_event_name: 'UserPromptSubmit', prompt: 'Refactor across modules.' },
    { hook_event_name: 'PreToolUse', tool_name: 'apply_patch' },
    { hook_event_name: 'Stop' },
  ]) {
    const result = spawnSync(process.execPath, [hook], {
      windowsHide: true,
      encoding: 'utf8',
      timeout: 5000,
      input: JSON.stringify(event),
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.stdout ? JSON.parse(result.stdout) : null, applyHookEvent(event));
  }
});
