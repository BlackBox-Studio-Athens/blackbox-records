import { createHash } from 'node:crypto';
import { mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EMPTY_STATE = Object.freeze({
  validationRequired: false,
  testRequired: false,
  renameRequired: false,
  serverRequired: false,
  validationFailure: '',
  serverFailure: '',
  validationStartedAt: 0,
  validationSessionId: '',
  validationPid: '',
});

const WRITE_TOOLS = new Set([
  'apply_patch',
  'mcp__intellij__apply_patch',
  'mcp__intellij__create_new_file',
  'mcp__intellij__reformat_file',
]);
const ROUTER_TOOL = 'mcp__intellij__execute_tool';

export function classifyShellCommand(command) {
  for (const segment of splitShellCommands(command)) {
    const tokens = commandTokens(stripRtkPrefix(segment));
    if (!tokens.length) continue;

    const executable = path.basename(tokens[0]).toLowerCase();
    const args = tokens.slice(1).map((token) => token.toLowerCase());
    const script = args.find((token) =>
      /^(?:test(?::[\w-]+)*|validate(?::[\w-]+)*|check(?::[\w-]+)*|build(?::[\w-]+)*|lint|format:check(?::[\w-]+)*)$/.test(
        token,
      ),
    );
    if (
      script ||
      ['vitest', 'jest'].includes(executable) ||
      args.some((token) => ['vitest', 'jest'].includes(token)) ||
      (executable === 'node' && args[0] === '--test')
    ) {
      return 'validation';
    }

    const serverScript = args.find((token) =>
      /^(?:dev|dev:web|dev:staff|dev:backend(?::[\w-]+)?|dev:stack:[\w-]+|worker:dev(?::[\w-]+)?|site:dev(?::[\w-]+)?)$/.test(
        token,
      ),
    );
    if (serverScript && !/:(?:status|logs|stop)$/.test(serverScript)) return 'server';
  }

  return null;
}

export function isReadOnlyShellCommand(command) {
  const segments = splitShellCommands(command).filter((segment) => segment.trim());
  if (!segments.length) return true;

  return segments.every((segment) => {
    const tokens = commandTokens(stripRtkPrefix(segment));
    if (!tokens.length) return true;
    const executable = path.basename(tokens[0]).toLowerCase();
    if (['rg', 'ls', 'dir', 'pwd', 'cat', 'type', 'get-content', 'get-childitem'].includes(executable)) return true;
    return (
      executable === 'git' && /^(?:status|diff|log|show|rev-parse|ls-files|grep)$/.test((tokens[1] || '').toLowerCase())
    );
  });
}

export function isBehaviorFile(filePath) {
  let value = String(filePath || '')
    .replaceAll('\\', '/')
    .replace(/^\.\//, '')
    .toLowerCase();
  const projectMarker = '/blackbox-records/';
  const markerIndex = value.lastIndexOf(projectMarker);
  if (markerIndex >= 0) value = value.slice(markerIndex + projectMarker.length);

  if (/^(?:docs|openspec|\.codex-artifacts)\//.test(value)) return false;
  if (/^(?:apps|packages|scripts|tools|\.codex|\.run)\//.test(value)) return true;
  return /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|astro\.config\.[^/]+|wrangler\.jsonc|tsconfig(?:\.[^/]*)?\.json|eslint\.config\.[^/]+|prettier\.config\.[^/]+)$/.test(
    value,
  );
}

export function detectRenameRequest(prompt) {
  return (
    /\brenam(?:e|ing)\b/i.test(prompt) &&
    (/(?:symbol|identifier|function|method|variable|class|type|component|reference)/i.test(prompt) ||
      /\b(?:across|in|throughout)\s+(?:the\s+)?(?:multiple|all|several|whole|entire)?\s*(?:files|project|codebase|repo)\b/i.test(
        prompt,
      ) ||
      /\ball references\b/i.test(prompt))
  );
}

export function applyHookEvent(event, previousState = EMPTY_STATE) {
  const state = { ...EMPTY_STATE, ...previousState };
  const eventName = event.hook_event_name || event.hookEventName;
  const toolName = event.tool_name || '';
  const command = event.tool_input?.command || '';
  const ideCall = webstormToolCall(event);

  if (eventName === 'UserPromptSubmit') {
    const prompt = event.prompt || '';
    const context = [];
    if (detectRenameRequest(prompt)) {
      state.renameRequired = true;
      context.push(
        'Use WebStorm MCP `rename_refactoring` for the cross-file code-symbol rename before editing references. If it is Router-only, call WebStorm MCP `execute_tool` with a command beginning `rename_refactoring` and the same arguments.',
      );
    }
    if (requestsValidation(prompt)) {
      state.testRequired = true;
      context.push(
        'Run tests or validation through WebStorm MCP `execute_run_configuration`; launch `BlackBox Validate` with `waitForExit: false` so the Stop hook can verify its fresh full summary. If the tool is Router-only, call `execute_tool` with a command beginning `execute_run_configuration` and the same arguments.',
      );
    }
    if (requestsLocalServer(prompt)) {
      state.serverRequired = true;
      state.serverFailure = '';
      context.push(
        'Start the requested local stack through WebStorm MCP `execute_run_configuration` using `BlackBox Local Stack` and `waitForExit: false`. If the tool is Router-only, call `execute_tool` with a command beginning `execute_run_configuration` and the same arguments.',
      );
    }
    return {
      state,
      output: context.length
        ? { hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: context.join(' ') } }
        : null,
    };
  }

  if (eventName === 'PreToolUse') {
    if (
      ideCall?.toolName === 'mcp__intellij__execute_run_configuration' &&
      ideCall.toolInput.configurationName === 'BlackBox Validate'
    ) {
      state.validationStartedAt = Date.now();
      state.validationSessionId = '';
      state.validationPid = '';
    }
    if (
      state.renameRequired &&
      (isMutationTool(toolName) ||
        (toolName === ROUTER_TOOL && ideCall?.toolName !== 'mcp__intellij__rename_refactoring'))
    ) {
      return {
        state,
        output: deny(
          'Complete the code-symbol rename with WebStorm MCP `rename_refactoring` before making direct edits.',
        ),
      };
    }
    if (state.renameRequired && toolName === 'Bash' && !isReadOnlyShellCommand(command)) {
      return {
        state,
        output: deny(
          'Complete the code-symbol rename with WebStorm MCP `rename_refactoring` before running shell commands or making edits.',
        ),
      };
    }
    if (toolName === 'Bash') {
      const kind = classifyShellCommand(command);
      if (kind === 'validation') {
        return {
          state,
          output: deny(
            'Run tests/checks through WebStorm MCP `execute_run_configuration`. Use `BlackBox Validate` for full completion validation.',
          ),
        };
      }
      if (kind === 'server') {
        return {
          state,
          output: deny(
            'Start local servers through WebStorm MCP `execute_run_configuration`. Use `BlackBox Local Stack` for the canonical local stack.',
          ),
        };
      }
    }
    return { state, output: null };
  }

  if (eventName === 'PostToolUse') {
    if (ideCall?.toolName === 'mcp__intellij__rename_refactoring' && toolSucceeded(event.tool_response)) {
      state.renameRequired = false;
      state.validationRequired = true;
      state.validationFailure = '';
      state.validationStartedAt = 0;
      state.validationSessionId = '';
      state.validationPid = '';
    } else if (ideCall?.toolName === 'mcp__intellij__execute_run_configuration') {
      const configurationName = ideCall.toolInput.configurationName || '';
      const report = executionReport(event.tool_response);
      if (configurationName === 'BlackBox Validate') {
        if (report.exitCode === 0 && ideCall.toolInput.waitForExit !== false) {
          state.validationRequired = false;
          state.testRequired = false;
          state.validationFailure = '';
          state.validationStartedAt = 0;
          state.validationSessionId = '';
          state.validationPid = '';
        } else {
          state.validationRequired = true;
          state.validationFailure =
            report.exitCode === undefined
              ? 'BlackBox Validate did not report completion.'
              : `BlackBox Validate exited with code ${report.exitCode}.`;
          if (report.sessionId && report.exitCode === undefined) {
            state.validationSessionId = report.sessionId;
            state.validationPid = event.validationPid || '';
          }
        }
      } else if (/test/i.test(configurationName) && report.exitCode === 0) {
        state.testRequired = false;
      }
      if (configurationName === 'BlackBox Local Stack') {
        if (report.sessionId && report.exitCode === undefined) {
          state.serverRequired = false;
          state.serverFailure = '';
        } else {
          state.serverFailure = 'BlackBox Local Stack did not remain running.';
        }
      }
    } else if (
      WRITE_TOOLS.has(ideCall?.toolName || toolName) &&
      toolSucceeded(event.tool_response) &&
      changedBehaviorFile(ideCall?.toolName || toolName, ideCall?.toolInput || event.tool_input)
    ) {
      state.validationRequired = true;
      state.validationFailure = '';
      state.validationStartedAt = 0;
      state.validationSessionId = '';
      state.validationPid = '';
    } else if (toolName === 'Bash' && shellMayWrite(command)) {
      state.validationRequired = true;
      state.validationFailure = '';
      state.validationStartedAt = 0;
      state.validationSessionId = '';
      state.validationPid = '';
    }
    return { state, output: null };
  }

  if (eventName === 'Stop') {
    const missing = [];
    if (state.renameRequired) missing.push('use WebStorm `rename_refactoring` for the requested symbol rename');
    if (state.validationRequired)
      missing.push(state.validationFailure || 'run `BlackBox Validate` through WebStorm MCP and get exit code 0');
    if (state.testRequired)
      missing.push('run the requested test configuration through WebStorm MCP and confirm exit code 0');
    if (state.serverRequired) missing.push(state.serverFailure || 'start `BlackBox Local Stack` through WebStorm MCP');
    if (!missing.length) return { state: { ...EMPTY_STATE }, clearState: true, output: null };

    const reason = `WebStorm workflow gate: ${missing.join('; ')}.`;
    return {
      state,
      output: event.stop_hook_active
        ? { continue: false, systemMessage: `${reason} Report this as blocked; do not claim the gate passed.` }
        : { decision: 'block', reason },
    };
  }

  return { state, output: null };
}

export function applyValidationSummary(state, summary) {
  const startedAt = Number(state.validationStartedAt || 0);
  const summaryStartedAt = Date.parse(summary?.startedAt || '');
  if (
    !startedAt ||
    !Number.isFinite(summaryStartedAt) ||
    summaryStartedAt < startedAt - 5000 ||
    summary?.mode !== 'full' ||
    summary?.scope !== 'all'
  ) {
    return false;
  }

  state.validationStartedAt = 0;
  state.validationSessionId = '';
  state.validationPid = '';
  if (summary.status === 'passed' && summary.exitCode === 0) {
    state.validationRequired = false;
    state.testRequired = false;
    state.validationFailure = '';
  } else {
    const failedPhase = summary.phases?.find((phase) => phase.status !== 'passed' || phase.exitCode !== 0);
    state.validationRequired = true;
    state.validationFailure = `BlackBox Validate summary was ${summary.status || 'incomplete'}${failedPhase ? ` (${failedPhase.name})` : ''}.`;
  }
  return true;
}

function isMutationTool(toolName) {
  return WRITE_TOOLS.has(toolName);
}

function webstormToolCall(event) {
  const toolName = event.tool_name || '';
  if (toolName !== ROUTER_TOOL) return { toolName, toolInput: event.tool_input || {} };

  const command = String(event.tool_input?.command || '').trim();
  const match = /^(?:"([^"]+)"|'([^']+)'|(\S+))/.exec(command);
  const routedName = (match?.[1] || match?.[2] || match?.[3] || '').replace(/^mcp__intellij__/, '');
  if (!routedName) return null;

  const toolInput = {};
  const argumentPattern = /(?:^|\s)(?:--)?([\w-]+)(?:\s+|=)(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)'|([^\s]+))/g;
  for (const argument of command.slice(match[0].length).matchAll(argumentPattern)) {
    const key = argument[1].replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
    const value = argument[2] ?? argument[3] ?? argument[4] ?? '';
    if (key === 'waitForExit') toolInput[key] = /^true$/i.test(value);
    else if (key === 'files') toolInput.files = [...(toolInput.files || []), value];
    else toolInput[key] = value;
  }
  return { toolName: `mcp__intellij__${routedName}`, toolInput };
}

function requestsValidation(prompt) {
  return (
    /\b(?:test|run|execute|validate|verify|check|build)\b/i.test(prompt) &&
    /\b(?:tests?|validation|checks?|build)\b/i.test(prompt)
  );
}

function requestsLocalServer(prompt) {
  if (/\b(?:don't|do not|never|avoid)\s+(?:start|run|launch|boot|serve)\b/i.test(prompt)) return false;
  return (
    /\b(?:start|run|launch|boot|serve)\b[\s\S]{0,45}\b(?:the\s+)?(?:(?:local|dev)\s+)*(?:server|site|app|stack)\b/i.test(
      prompt,
    ) || /\b(?:start|run|launch)\s+pnpm\s+(?:dev|dev:stack:[\w-]+)\b/i.test(prompt)
  );
}

function deny(reason) {
  return {
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason },
  };
}

function changedBehaviorFile(toolName, input = {}) {
  const paths =
    toolName === 'mcp__intellij__create_new_file'
      ? [input.pathInProject]
      : toolName === 'mcp__intellij__reformat_file'
        ? input.files || []
        : patchPaths(input.command || input.patch || input.diff || '');
  return paths.length ? paths.some(isBehaviorFile) : toolName !== 'apply_patch';
}

function patchPaths(patch) {
  const paths = [];
  for (const match of String(patch).matchAll(/^\*\*\* (?:Update|Add|Delete) File:\s*(.+)$/gm))
    paths.push(match[1].trim());
  for (const match of String(patch).matchAll(/^\+\+\+ b\/(.+)$/gm)) paths.push(match[1].trim());
  return [...new Set(paths)];
}

function shellMayWrite(command) {
  return (
    /\b(?:git\s+apply|set-content|add-content|out-file|move-item|rename-item|copy-item|remove-item|sed\s+-i|perl\s+-pi|prettier\s+.*--write|pnpm\s+format(?:\s|$))\b/i.test(
      command,
    ) || /(?:^|\s)>{1,2}\s*[^>&\s]/.test(command)
  );
}

function splitShellCommands(command) {
  const segments = [];
  let current = '';
  let quote = '';
  for (let index = 0; index < String(command).length; index += 1) {
    const char = command[index];
    if (quote) {
      current += char;
      if (char === quote && command[index - 1] !== '`') quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === ';' || char === '\n' || char === '|' || (char === '&' && command[index + 1] === '&')) {
      segments.push(current);
      current = '';
      if (char !== ';' && char !== '\n' && command[index + 1] === char) index += 1;
      continue;
    }
    current += char;
  }
  segments.push(current);
  return segments;
}

function stripRtkPrefix(segment) {
  return segment
    .trim()
    .replace(/^&\s*/, '')
    .replace(/^(?:'[^']*rtk\.exe'|"[^"]*rtk\.exe")\s+/i, '')
    .replace(/^rtk(?:\.exe)?\s+/i, '')
    .replace(/^&\s*/, '');
}

function commandTokens(segment) {
  return [...segment.matchAll(/"([^"`]*)"|'([^']*)'|([^\s]+)/g)].map((match) => match[1] ?? match[2] ?? match[3]);
}

function toolSucceeded(response) {
  if (containsErrorFlag(response)) return false;
  const text = responseText(response);
  return !/^\s*(?:error|failed|could not|cannot)\b/i.test(text);
}

function containsErrorFlag(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return false;
  seen.add(value);
  if (value.isError === true || value.error) return true;
  return Object.values(value).some((item) => containsErrorFlag(item, seen));
}

function responseText(value, seen = new Set()) {
  if (typeof value === 'string') {
    try {
      return responseText(JSON.parse(value), seen);
    } catch {
      return value;
    }
  }
  if (!value || typeof value !== 'object' || seen.has(value)) return '';
  seen.add(value);
  if (typeof value.text === 'string') return value.text;
  return Object.values(value)
    .map((item) => responseText(item, seen))
    .filter(Boolean)
    .join('\n');
}

function executionReport(response, seen = new Set()) {
  if (typeof response === 'string') {
    try {
      return executionReport(JSON.parse(response), seen);
    } catch {
      return {};
    }
  }
  if (!response || typeof response !== 'object' || seen.has(response)) return {};
  seen.add(response);
  if ('exitCode' in response || 'sessionId' in response) return response;
  for (const value of Object.values(response)) {
    const report = executionReport(value, seen);
    if ('exitCode' in report || 'sessionId' in report) return report;
  }
  return {};
}

async function statePathFor(event) {
  const key = `${event.session_id || ''}\0${path.resolve(event.cwd || process.cwd())}`;
  const digest = createHash('sha256').update(key).digest('hex');
  const directory = path.join(tmpdir(), 'blackbox-records-codex-hooks');
  await mkdir(directory, { recursive: true });
  return path.join(directory, `${digest}.json`);
}

async function withState(event, update) {
  const file = await statePathFor(event);
  const lock = `${file}.lock`;
  const deadline = Date.now() + 1000;
  let lockHandle;
  while (!lockHandle) {
    try {
      lockHandle = await open(lock, 'wx');
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        const lockStat = await stat(lock);
        if (Date.now() - lockStat.mtimeMs > 30000) await unlink(lock);
      } catch (statError) {
        if (statError.code !== 'ENOENT') throw statError;
      }
      if (Date.now() >= deadline) throw new Error('Timed out acquiring workflow state lock.', { cause: error });
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  try {
    let state = { ...EMPTY_STATE };
    try {
      state = { ...state, ...JSON.parse(await readFile(file, 'utf8')) };
    } catch (error) {
      if (error.code !== 'ENOENT') state.validationRequired = true;
    }
    const result = update(state);
    if (result.clearState) {
      await unlink(file).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    } else {
      const temporary = `${file}.${process.pid}.tmp`;
      await writeFile(temporary, JSON.stringify(result.state), 'utf8');
      await rename(temporary, file);
    }
    return result;
  } finally {
    await lockHandle.close();
    await unlink(lock).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

async function activeValidationPid(cwd) {
  try {
    return (await readFile(path.join(cwd, '.codex-artifacts', 'validation', 'active.lock'), 'utf8')).trim();
  } catch {
    return '';
  }
}

async function findValidationSummary(cwd, state) {
  const root = path.join(cwd, '.codex-artifacts', 'validation');
  const pid = state.validationPid || (await activeValidationPid(cwd));
  let directories;
  try {
    directories = (await readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && /^\d{4}-/.test(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => right.localeCompare(left));
  } catch {
    return null;
  }
  if (pid) directories = directories.filter((name) => name.endsWith(`-${pid}`));
  else directories = directories.slice(0, 5);

  for (const directory of directories) {
    try {
      const summary = JSON.parse(await readFile(path.join(root, directory, 'summary.json'), 'utf8'));
      const timestamp = Date.parse(summary.startedAt || '');
      if (Number.isFinite(timestamp) && timestamp >= Number(state.validationStartedAt) - 5000) return summary;
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error;
    }
  }
  return null;
}

async function waitForValidationSummary(cwd, state) {
  const deadline = Date.now() + 270000;
  while (true) {
    const summary = await findValidationSummary(cwd, state);
    if (summary) return summary;
    if (Date.now() >= deadline) return null;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  let event = JSON.parse(input || '{}');
  if (
    event.hook_event_name === 'PostToolUse' &&
    webstormToolCall(event)?.toolName === 'mcp__intellij__execute_run_configuration' &&
    webstormToolCall(event).toolInput.configurationName === 'BlackBox Validate'
  ) {
    event = { ...event, validationPid: await activeValidationPid(path.resolve(event.cwd || process.cwd())) };
  }
  let result = await withState(event, (state) => applyHookEvent(event, state));
  if (event.hook_event_name === 'Stop' && result.state.validationRequired && result.state.validationStartedAt) {
    const summary = await waitForValidationSummary(path.resolve(event.cwd || process.cwd()), result.state);
    if (summary) {
      result = await withState(event, (state) => {
        applyValidationSummary(state, summary);
        return applyHookEvent(event, state);
      });
    }
  }
  if (result.output) process.stdout.write(JSON.stringify(result.output));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    process.stderr.write('BlackBox WebStorm workflow hook failed.\n');
    process.exit(2);
  });
}
