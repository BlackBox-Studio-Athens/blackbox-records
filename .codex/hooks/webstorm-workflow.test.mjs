import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyHookEvent,
  applyValidationSummary,
  classifyShellCommand,
  detectRenameRequest,
  isBehaviorFile,
  isReadOnlyShellCommand,
} from './webstorm-workflow.mjs';

test('routes validation and server commands through WebStorm configurations', () => {
  assert.equal(
    applyHookEvent({ hook_event_name: 'UserPromptSubmit', prompt: 'Please test this change.' }).state.testRequired,
    true,
  );
  const validationRequest = applyHookEvent({
    hook_event_name: 'UserPromptSubmit',
    prompt: 'Run validation.',
  });
  assert.match(validationRequest.output.hookSpecificOutput.additionalContext, /waitForExit: false/);
  assert.equal(classifyShellCommand('pnpm validate'), 'validation');
  assert.equal(classifyShellCommand("& 'C:\\Users\\SVall\\.local\\bin\\rtk.exe' pnpm test:unit"), 'validation');
  assert.equal(classifyShellCommand('pnpm --filter @blackbox/web exec vitest run'), 'validation');
  assert.equal(classifyShellCommand('pnpm dev:stack:stripe-mock'), 'server');
  assert.equal(classifyShellCommand('pnpm site:dev:status'), null);
  assert.equal(classifyShellCommand('rg "pnpm validate" README.md'), null);
  assert.equal(
    applyHookEvent({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'pnpm validate' } })
      .output.hookSpecificOutput.permissionDecision,
    'deny',
  );
  assert.equal(
    applyHookEvent({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'pnpm dev' } }).output
      .hookSpecificOutput.permissionDecision,
    'deny',
  );
});

test('requires semantic MCP rename for cross-file symbol changes', () => {
  assert.equal(detectRenameRequest('Rename the function across multiple files.'), true);
  assert.equal(detectRenameRequest('Rename the editorial label in the content.'), false);
  const pending = applyHookEvent({
    hook_event_name: 'UserPromptSubmit',
    prompt: 'Rename this symbol across multiple files.',
  });
  const denied = applyHookEvent(
    { hook_event_name: 'PreToolUse', tool_name: 'apply_patch', tool_input: {} },
    pending.state,
  );
  assert.equal(denied.output.hookSpecificOutput.permissionDecision, 'deny');
  const completed = applyHookEvent(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__rename_refactoring',
      tool_response: { content: [{ type: 'text', text: 'Symbol renamed successfully.' }] },
    },
    pending.state,
  );
  assert.equal(completed.state.renameRequired, false);
  assert.equal(completed.state.validationRequired, true);
  const failed = applyHookEvent(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__rename_refactoring',
      tool_response: { isError: true },
    },
    pending.state,
  );
  assert.equal(failed.state.renameRequired, true);
});

test('tracks renames and run configurations dispatched through the WebStorm router', () => {
  const pending = applyHookEvent({
    hook_event_name: 'UserPromptSubmit',
    prompt: 'Rename this symbol across multiple files.',
  });
  const blocked = applyHookEvent(
    {
      hook_event_name: 'PreToolUse',
      tool_name: 'mcp__intellij__execute_tool',
      tool_input: { command: 'create_new_file --pathInProject src/new-file.ts' },
    },
    pending.state,
  );
  assert.equal(blocked.output.hookSpecificOutput.permissionDecision, 'deny');
  const renamed = applyHookEvent(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__execute_tool',
      tool_input: {
        command:
          'rename_refactoring --pathInProject "apps/web/src/lib/site-data.ts" --symbolName oldName --newName newName',
      },
      tool_response: { content: [{ type: 'text', text: 'Symbol renamed successfully.' }] },
    },
    pending.state,
  );
  assert.equal(renamed.state.renameRequired, false);
  assert.equal(renamed.state.validationRequired, true);

  const validated = applyHookEvent(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__execute_tool',
      tool_input: {
        command: 'execute_run_configuration --configurationName "BlackBox Validate" --waitForExit true',
      },
      tool_response: { structuredContent: { exitCode: 0 } },
    },
    renamed.state,
  );
  assert.equal(validated.state.validationRequired, false);
  assert.equal(validated.state.testRequired, false);
});

test('requires a successful full validation after behavior edits', () => {
  assert.equal(isBehaviorFile('apps/web/src/pages/index.astro'), true);
  assert.equal(isBehaviorFile('docs/content-publication.md'), false);
  const edited = applyHookEvent({
    hook_event_name: 'PostToolUse',
    tool_name: 'apply_patch',
    tool_input: { command: '*** Begin Patch\n*** Update File: apps/web/src/pages/index.astro\n*** End Patch' },
    tool_response: 'Applied patch.',
  });
  const blocked = applyHookEvent({ hook_event_name: 'Stop' }, edited.state);
  assert.equal(blocked.output.decision, 'block');
  const passed = applyHookEvent(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__execute_run_configuration',
      tool_input: { configurationName: 'BlackBox Validate' },
      tool_response: { structuredContent: { exitCode: 0 } },
    },
    edited.state,
  );
  assert.equal(passed.state.validationRequired, false);
  assert.equal(applyHookEvent({ hook_event_name: 'Stop' }, passed.state).clearState, true);
  const failed = applyHookEvent(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__execute_run_configuration',
      tool_input: { configurationName: 'BlackBox Validate' },
      tool_response: { structuredContent: { exitCode: 1 } },
    },
    edited.state,
  );
  assert.equal(failed.state.validationRequired, true);
  assert.equal(applyHookEvent({ hook_event_name: 'Stop' }, failed.state).output.decision, 'block');
});

test('accepts only a fresh full validation summary', () => {
  const state = {
    validationRequired: true,
    testRequired: true,
    validationStartedAt: 100000,
    validationSessionId: 'validate#1',
  };
  const passed = {
    mode: 'full',
    scope: 'all',
    status: 'passed',
    exitCode: 0,
    startedAt: new Date(101000).toISOString(),
  };
  assert.equal(applyValidationSummary(state, passed), true);
  assert.equal(state.validationRequired, false);
  assert.equal(state.testRequired, false);
  assert.equal(state.validationSessionId, '');

  const staleState = { validationRequired: true, validationStartedAt: 200000 };
  assert.equal(applyValidationSummary(staleState, { ...passed, startedAt: new Date(190000).toISOString() }), false);
  assert.equal(staleState.validationRequired, true);

  const failedState = { validationRequired: true, validationStartedAt: 100000 };
  assert.equal(
    applyValidationSummary(failedState, {
      ...passed,
      status: 'failed',
      exitCode: 1,
      phases: [{ name: 'lint', status: 'failed', exitCode: 1 }],
    }),
    true,
  );
  assert.equal(failedState.validationRequired, true);
  assert.match(failedState.validationFailure, /lint/);
});

test('accepts a running local stack only after its MCP configuration starts', () => {
  const requested = applyHookEvent({ hook_event_name: 'UserPromptSubmit', prompt: 'Start the local server.' });
  assert.equal(requested.state.serverRequired, true);
  assert.equal(applyHookEvent({ hook_event_name: 'Stop' }, requested.state).output.decision, 'block');
  const started = applyHookEvent(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__execute_run_configuration',
      tool_input: { configurationName: 'BlackBox Local Stack', waitForExit: false },
      tool_response: { structuredContent: { sessionId: 'local-stack#1' } },
    },
    requested.state,
  );
  assert.equal(started.state.serverRequired, false);
  assert.equal(applyHookEvent({ hook_event_name: 'Stop' }, started.state).clearState, true);
  const routedStart = applyHookEvent(
    {
      hook_event_name: 'PostToolUse',
      tool_name: 'mcp__intellij__execute_tool',
      tool_input: {
        command: 'execute_run_configuration --configurationName "BlackBox Local Stack" --waitForExit false',
      },
      tool_response: { structuredContent: { sessionId: 'local-stack#2' } },
    },
    requested.state,
  );
  assert.equal(routedStart.state.serverRequired, false);
});

test('rename-gated shell permits reads but blocks unclassified commands', () => {
  assert.equal(isReadOnlyShellCommand('rtk rg -n "symbol" apps/web/src'), true);
  assert.equal(isReadOnlyShellCommand('pnpm validate'), false);
});
