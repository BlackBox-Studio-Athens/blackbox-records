import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { applyHookEvent, detectRenameRequest } from './webstorm-workflow.mjs';

test('routes test and validation commands through WebStorm while allowing checks and server commands', () => {
  const config = JSON.parse(readFileSync(new URL('../hooks.json', import.meta.url), 'utf8'));
  assert.equal(config.hooks.Stop, undefined);

  const ordinary = applyHookEvent({
    hook_event_name: 'UserPromptSubmit',
    prompt: 'Policy says run `pnpm test:unit` after edits.\n\nSimplify the hook.',
  });
  assert.equal(ordinary.state.renameRequired, false);
  assert.equal(ordinary.output, null);

  const requested = applyHookEvent({ hook_event_name: 'UserPromptSubmit', prompt: 'Please run the tests.' });
  assert.match(requested.output.hookSpecificOutput.additionalContext, /execute_run_configuration/);
  const requestedValidation = applyHookEvent({
    hook_event_name: 'UserPromptSubmit',
    prompt: 'Please run pnpm validate.',
  });
  assert.match(requestedValidation.output.hookSpecificOutput.additionalContext, /execute_run_configuration/);
  assert.equal(
    applyHookEvent({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'pnpm test:unit' } })
      .output.hookSpecificOutput.permissionDecision,
    'deny',
  );
  assert.equal(
    applyHookEvent({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'pnpm smoke:stripe-uat' },
    }).output.hookSpecificOutput.permissionDecision,
    'deny',
  );
  assert.equal(
    applyHookEvent({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'pnpm exec playwright test' },
    }).output.hookSpecificOutput.permissionDecision,
    'deny',
  );
  for (const command of ['pnpm validate', 'pnpm validate:fast --scope all', 'node --import tsx scripts/validate.mjs']) {
    assert.equal(
      applyHookEvent({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } }).output
        .hookSpecificOutput.permissionDecision,
      'deny',
      command,
    );
  }
  assert.equal(
    applyHookEvent({
      hook_event_name: 'PreToolUse',
      tool_name: 'Bash',
      tool_input: { command: 'pnpm dev:stack:stripe-mock' },
    }).output,
    null,
  );
  assert.equal(
    applyHookEvent({
      tool_name: 'Bash',
      hook_event_name: 'PreToolUse',
      tool_input: { command: 'rtk rg "pnpm test" README.md' },
    }).output,
    null,
  );
});

test('routes cross-file symbol renames through WebStorm and clears the gate after success', () => {
  assert.equal(detectRenameRequest('Rename this function across multiple files.'), true);
  assert.equal(detectRenameRequest('Rename the editorial label in the content.'), false);

  const requested = applyHookEvent({
    hook_event_name: 'UserPromptSubmit',
    prompt: 'Rename this symbol across multiple files.',
  });
  const blocked = applyHookEvent(
    { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: {} },
    requested.state,
  );
  assert.equal(blocked.output.hookSpecificOutput.permissionDecision, 'deny');

  const allowed = applyHookEvent(
    {
      hook_event_name: 'PreToolUse',
      tool_name: 'mcp__webstorm__execute_tool',
      tool_input: { command: 'rename_refactoring --symbolName getName --newName readName' },
    },
    requested.state,
  );
  assert.equal(allowed.output, null);
  assert.equal(
    applyHookEvent(
      {
        hook_event_name: 'PreToolUse',
        tool_name: 'mcp__webstorm__execute_tool',
        tool_input: { command: 'apply_patch --patch "..."' },
      },
      requested.state,
    ).output.hookSpecificOutput.permissionDecision,
    'deny',
  );

  const completed = applyHookEvent(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__rename_refactoring',
      tool_response: { content: [{ type: 'text', text: 'Symbol renamed successfully.' }] },
    },
    requested.state,
  );
  assert.equal(completed.state.renameRequired, false);
  assert.equal(
    applyHookEvent({ hook_event_name: 'UserPromptSubmit', prompt: 'Fix the README copy.' }, requested.state).state
      .renameRequired,
    false,
  );
});
