import { createHash } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROUTER_TOOL = 'mcp__webstorm__execute_tool';
const EDIT_TOOLS = new Set(['apply_patch', 'create_new_file', 'reformat_file']);
const TEST_SCRIPT = /^(?:test|smoke|validate)(?::[\w-]+)*$/i;

export function applyHookEvent(event, state = { renameRequired: false }) {
  const eventName = event.hook_event_name || event.hookEventName;
  const toolName = event.tool_name || '';
  const input = event.tool_input || {};
  const operation = webstormOperation(toolName, input);

  if (eventName === 'UserPromptSubmit') {
    const prompt = lastParagraph(event.prompt || '');
    const renameRequired = detectRenameRequest(prompt);
    const context = [];
    if (requestsTests(prompt)) {
      context.push(
        'Run the requested test configuration through WebStorm MCP and confirm exit code 0. Router-only: call `mcp__webstorm__execute_tool` with a command beginning `execute_run_configuration` and the requested arguments.',
      );
    }
    if (renameRequired) {
      context.push(
        'Use WebStorm MCP `rename_refactoring` for this cross-file symbol rename before editing. Router-only: call `mcp__webstorm__execute_tool` with a command beginning `rename_refactoring` and the requested arguments.',
      );
    }
    return {
      state: { renameRequired },
      output: context.length
        ? { hookSpecificOutput: { hookEventName: eventName, additionalContext: context.join(' ') } }
        : null,
    };
  }

  if (eventName === 'PreToolUse') {
    if (toolName === 'Bash' && isTestCommand(input.command || '')) {
      return { state, output: deny('Run tests through WebStorm MCP `execute_run_configuration`.') };
    }
    if (state.renameRequired && isEditTool(toolName, operation)) {
      return { state, output: deny('Use WebStorm MCP `rename_refactoring` before editing for this symbol rename.') };
    }
  }

  if (
    eventName === 'PostToolUse' &&
    state.renameRequired &&
    operation === 'rename_refactoring' &&
    toolSucceeded(event.tool_response)
  ) {
    return { state: { renameRequired: false }, output: null };
  }

  return { state, output: null };
}

export function detectRenameRequest(prompt) {
  return (
    /\brename\b/i.test(prompt) &&
    (/\b(?:symbol|identifier|function|method|variable|class|type|component|references?)\b/i.test(prompt) ||
      /\b(?:across|throughout)\b[\s\S]{0,50}\b(?:files|project|codebase|repo)\b/i.test(prompt))
  );
}

function requestsTests(prompt) {
  return (
    /\b(?:run|execute)\b[\s\S]{0,40}\b(?:tests?|test suite|test configuration|vitest|jest)\b/i.test(prompt) ||
    /\b(?:please\s+)?test\s+(?:this|these|the|all|change|changes|suite)\b/i.test(prompt) ||
    /\b(?:pnpm|npm|yarn)\s+(?:--filter\s+\S+\s+)?(?:test|smoke|validate)(?::[\w-]+)*\b/i.test(prompt)
  );
}

function isTestCommand(command) {
  const tokens = [...String(command).matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(
    (match) => match[1] ?? match[2] ?? match[3],
  );
  for (let index = 0; index < tokens.length; index += 1) {
    const executable = tokens[index].split(/[\\/]/).pop().toLowerCase();
    if (
      ['pnpm', 'npm', 'yarn'].includes(executable) &&
      tokens.slice(index + 1).some((token) => TEST_SCRIPT.test(token))
    )
      return true;
    if (
      ['vitest', 'jest'].includes(executable) ||
      (executable === 'playwright' && tokens[index + 1] === 'test') ||
      (executable === 'node' && tokens[index + 1] === '--test')
    )
      return true;
    if (/(?:^|[/\\])scripts[/\\](?:test|smoke|validate)[\w.-]*\.[\w]+$/i.test(tokens[index])) return true;
  }
  return false;
}

function isEditTool(toolName, operation) {
  if (toolName === 'Bash' || toolName === 'apply_patch') return true;
  if (toolName === ROUTER_TOOL) return EDIT_TOOLS.has(operation);
  return EDIT_TOOLS.has(operation || '');
}

function webstormOperation(toolName, input) {
  if (toolName === ROUTER_TOOL) {
    return String(input.command || '')
      .trim()
      .split(/\s+/, 1)[0]
      .replace(/^mcp__webstorm__/, '');
  }
  const direct = /^mcp__(?:webstorm|intellij)__(.+)$/.exec(toolName);
  if (direct) return direct[1];
  return '';
}

function lastParagraph(prompt) {
  return (
    String(prompt)
      .trim()
      .split(/\r?\n\s*\r?\n/)
      .at(-1) || ''
  );
}

function toolSucceeded(response) {
  const text = Array.isArray(response?.content) ? response.content.map((item) => item.text || '').join('\n') : '';
  return response?.isError !== true && !/^\s*(?:error|failed|could not|cannot)\b/i.test(text);
}

function deny(reason) {
  return {
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  };
}

async function statePathFor(event) {
  const key = `${event.session_id || ''}\0${path.resolve(event.cwd || process.cwd())}`;
  const digest = createHash('sha256').update(key).digest('hex');
  return path.join(tmpdir(), `blackbox-records-codex-hooks-${digest}.json`);
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const event = JSON.parse(input || '{}');
  const file = await statePathFor(event);
  let state = { renameRequired: false };
  try {
    state = { ...state, ...JSON.parse(await readFile(file, 'utf8')) };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const result = applyHookEvent(event, state);
  if (result.state.renameRequired) {
    // ponytail: assumes sequential hook events; add a lock if writes can race.
    await writeFile(file, JSON.stringify(result.state), 'utf8');
  } else
    await unlink(file).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  if (result.output) process.stdout.write(JSON.stringify(result.output));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    process.stderr.write('BlackBox WebStorm workflow hook failed.\n');
    process.exit(2);
  });
}
