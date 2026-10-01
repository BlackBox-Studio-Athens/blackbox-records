import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guardedScript, satisfiesFilter } from '../feedback-guard.mjs';
import { appendHistory, commandTier, loadPolicy, releaseTierAllowance } from '../feedback-policy.mjs';

const checkoutRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assignment = /^[A-Za-z_]\w*=/;
const keywords = new Set('! if then else elif do while until time nohup exec command'.split(' '));
const posixShells = new Set(['bash', 'sh', 'zsh', 'dash']);
const rtkRunners = new Set(['proxy', 'err', 'test', 'summary']);
const powershellEscapes = new Set(['"', "'", '`', '$', '0', 'a', 'b', 'e', 'f', 'n', 'r', 't', 'v', ' ', '\n', '\r']);
const valuedPackageOptions = new Set(['--filter', '--filter-prod', '-F', '-C', '--dir', '--loglevel', '--reporter']);
const scopingPackageOption = /^(--filter|--filter-prod|-F|-C|--dir|-r|--recursive)(=|$)/;
const nodeValuedOptions = [
  '--import',
  '--require',
  '-r',
  '--loader',
  '--experimental-loader',
  '--conditions',
  '-C',
  '--env-file',
  '--tsconfig',
];
// A package CLI started by path, such as `node node_modules/nx/bin/nx.js`, is judged as the runner it is.
const packageRunners = new Map([
  ['nx', 'nx'],
  ['vitest', 'vitest'],
  ['playwright', 'playwright'],
  ['@playwright/test', 'playwright'],
  ['eslint', 'eslint'],
  ['prettier', 'prettier'],
  ['typescript', 'tsc'],
  ['astro', 'astro'],
]);

/*
 * The matcher approximates bash, PowerShell and cmd closely enough for commands agents write; it is not a shell.
 * It finds commands at statement starts (after `&&`, `||`, `;`, `|`, `&`, newlines, braces and parentheses) and
 * inside `$(...)` and backticks (a backtick before a PowerShell escape letter counts as an escape), skips quoted
 * text, comments, bash heredocs and PowerShell here-strings, strips environment assignments, shell keywords and the
 * `env`, `rtk [proxy|err|test|summary|run]`, `corepack`, `npx`, `pnpm exec|dlx` and `npm exec` wrappers, and reads
 * the payload of `bash|sh -c`, `pwsh|powershell -Command` and `cmd /c`. A `node` or `tsx` script path inside one of
 * the `packageRunners` packages is judged as that runner, and a path ending in a `guardedScripts` file as the root
 * command it belongs to. It does not follow aliases, functions, variables holding commands, `xargs`, `Start-Process`,
 * `-EncodedCommand`, `node -e` code, a guarded script named relative to a `cd` target, or a `cd` into a package
 * before a bare `pnpm <script>`. Rules marked `anywhere` match the raw text or the path a file tool writes, so they
 * also deny a command that only mentions the grant file or override variable.
 */
export function commandSegments(text, segments = []) {
  scan(text, 0, segments, '');
  return segments;
}

function scan(text, start, segments, closer) {
  let segment = '';
  let depth = 0;
  const heredocs = [];
  const flush = () => {
    if (segment.trim()) segments.push(segment.trim());
    segment = '';
  };
  let index = start;
  while (index < text.length) {
    const char = text[index];
    const next = text[index + 1];
    if (char === closer && (closer === '`' || depth === 0)) {
      flush();
      return index + 1;
    }
    if (char === '#' && /[\s;&|(){}]/.test(text[index - 1] ?? ' ')) {
      index = closingIndex(text, '\n', index);
      continue;
    }
    let end;
    if (char === "'") end = closingIndex(text, "'", index + 1) + 1;
    else if (char === '"') end = scanDoubleQuoted(text, index, segments);
    else if (char === '\\') end = index + 2;
    else if (char === '`') end = powershellEscapes.has(next) ? index + 2 : scan(text, index + 1, segments, '`');
    else if (char === '$' && next === '(') end = scan(text, index + 2, segments, ')');
    else if (char === '$' && next === '{') end = closingIndex(text, '}', index) + 1;
    else if (char === '@' && (next === "'" || next === '"') && /[\r\n]/.test(text[index + 2] ?? ''))
      end = closingIndex(text, `\n${next}@`, index) + 3;
    else if (char === '<' && next === '<' && text[index + 2] !== '<') {
      const heredoc = /^<<(-?)\s*(['"]?)([\w-]+)\2/.exec(text.slice(index));
      if (heredoc) heredocs.push(heredoc[3]);
      end = index + (heredoc?.[0].length ?? 2);
    } else if (char === '&' && (next === '>' || text[index - 1] === '>')) end = index + 1;
    if (end !== undefined) {
      segment += text.slice(index, end);
      index = Math.min(end, text.length);
      continue;
    }
    if (char === '\n' || char === '\r' || ';|&(){}'.includes(char)) {
      flush();
      if (closer === ')' && char === '(') depth += 1;
      if (char === ')' && depth > 0) depth -= 1;
      index += 1;
      if (char === '\n' && heredocs.length) index = skipHeredocBodies(text, index, heredocs.splice(0));
      continue;
    }
    segment += char;
    index += 1;
  }
  flush();
  return index;
}

function closingIndex(text, token, from) {
  const found = text.indexOf(token, from);
  return found < 0 ? text.length : found;
}

function scanDoubleQuoted(text, start, segments) {
  let index = start + 1;
  while (index < text.length && text[index] !== '"') {
    const next = text[index + 1];
    if (text[index] === '\\' && '"\\$`'.includes(next)) index += 2;
    else if (text[index] === '$' && next === '(') index = scan(text, index + 2, segments, ')');
    else if (text[index] === '`')
      index = powershellEscapes.has(next) ? index + 2 : scan(text, index + 1, segments, '`');
    else index += 1;
  }
  return index + 1;
}

function skipHeredocBodies(text, start, delimiters) {
  let index = start;
  for (const delimiter of delimiters) {
    while (index < text.length) {
      const lineEnd = closingIndex(text, '\n', index);
      const line = text.slice(index, lineEnd).trim();
      index = lineEnd + 1;
      if (line === delimiter) break;
    }
  }
  return index;
}

function words(segment) {
  const result = [];
  let index = 0;
  for (;;) {
    while (/\s/.test(segment[index] ?? '')) index += 1;
    if (index >= segment.length) return result;
    let value = '';
    while (index < segment.length && !/\s/.test(segment[index])) {
      const quote = segment[index];
      if (quote !== "'" && quote !== '"') {
        value += quote;
        index += 1;
        continue;
      }
      let end = index + 1;
      while (end < segment.length && segment[end] !== quote) end += quote === '"' && segment[end] === '\\' ? 2 : 1;
      const quoted = segment.slice(index + 1, end);
      value += quote === '"' ? quoted.replace(/\\(["\\$`])/g, '$1') : quoted;
      index = end + 1;
    }
    result.push({ value, rest: segment.slice(index).trim() });
  }
}

function programName(word) {
  return path.win32
    .basename(word)
    .toLowerCase()
    .replace(/\.(cmd|exe|bat|ps1)$/, '');
}

function dropOptions(list, valued = []) {
  let index = 0;
  while (list[index]?.value.startsWith('-')) index += valued.includes(list[index].value) ? 2 : 1;
  return list.slice(index);
}

function payloadAfter(list, flagIndex) {
  const rest = list.slice(flagIndex + 1);
  return rest.length === 1 ? rest[0].value : (list[flagIndex]?.rest ?? '');
}

function collect(text, context, depth) {
  if (depth > 6) return;
  for (const segment of commandSegments(text)) expand(words(segment), context, depth);
}

function expand(list, context, depth) {
  for (;;) {
    const word = list[0]?.value;
    if (word === undefined) return;
    const program = programName(word);
    if (assignment.test(word) || keywords.has(word)) list = list.slice(1);
    else if (program === 'env') list = dropOptions(list.slice(1), ['-u', '--unset', '-C', '--chdir']);
    else if (program === 'rtk') {
      list = dropOptions(list.slice(1));
      if (list[0]?.value === 'run') return collect(payloadAfter(list, 0), context, depth + 1);
      if (rtkRunners.has(list[0]?.value)) list = list.slice(1);
      else if (list[0]?.value === 'lint') list = [{ value: 'eslint', rest: list[0].rest }, ...list.slice(1)];
    } else if (program === 'corepack') list = list.slice(1);
    else if (program === 'npx' || program === 'pnpx') list = dropOptions(list.slice(1), ['-p', '--package']);
    else break;
  }
  const program = programName(list[0].value);
  const args = list.slice(1);
  context.views.push([program, ...args.map(({ value }) => value)].join(' '));
  if (program === 'node' || program === 'tsx') expandScript(dropOptions(args, nodeValuedOptions), context, depth);
  else if (program === 'pnpm' || program === 'npm') expandPackageManager(program, args, context, depth);
  else if (posixShells.has(program)) {
    const flag = args.findIndex(({ value }) => /^-[a-z]*c[a-z]*$/.test(value));
    if (flag >= 0 && args[flag + 1]) collect(args[flag + 1].value, context, depth + 1);
  } else if (program === 'pwsh' || program === 'powershell') {
    const flag = args.findIndex(({ value }) => /^-c(o(m(m(a(n(d)?)?)?)?)?)?$/i.test(value));
    if (flag >= 0) collect(payloadAfter(args, flag), context, depth + 1);
  } else if (program === 'cmd') {
    const flag = args.findIndex(({ value }) => /^\/[ck]$/i.test(value));
    if (flag >= 0) collect(payloadAfter(args, flag), context, depth + 1);
  }
}

function expandScript([script, ...rest], context, depth) {
  if (!script) return;
  const typed = script.value.replaceAll('\\', '/').toLowerCase();
  const [, packageName] = /(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)\/(?:(?!node_modules\/).)*$/.exec(typed) ?? [];
  const runner = packageRunners.get(packageName);
  if (runner) return expand([{ value: runner, rest: script.rest }, ...rest], context, depth + 1);
  const args = rest.map(({ value }) => value);
  const guarded = guardedScript(context.policy, script.value, args);
  if (guarded) context.scripts.push({ name: guarded.command, args });
}

function expandPackageManager(program, args, context, depth) {
  let index = 0;
  let scoped = false;
  while (args[index]?.value.startsWith('-')) {
    scoped ||= scopingPackageOption.test(args[index].value);
    index += valuedPackageOptions.has(args[index].value) ? 2 : 1;
  }
  const verb = args[index]?.value;
  if (verb === 'exec' || verb === 'dlx' || (program === 'npm' && verb === 'x')) {
    const binary = dropOptions(args.slice(index + 1), ['--package', '-c', '--shell-mode']);
    if (binary.length) expand(binary, context, depth + 1);
    return;
  }
  if (scoped || verb === undefined) return;
  const named = verb === 'run' || verb === 'run-script' ? index + 1 : index;
  const name = args[named]?.value;
  if (name === undefined) return;
  if (commandTier(context.policy, name))
    context.scripts.push({ name, args: args.slice(named + 1).map(({ value }) => value) });
  // pnpm runs a package binary when no root script has the name.
  else if (program === 'pnpm' && named === index) expand(args.slice(index), context, depth + 1);
}

/**
 * The first policy rule `command` breaks, or null. `anywhere` rules read `raw`, which is the command or the
 * path a file tool writes. Pure pattern checks run first; the grant, which needs git, is resolved only when a
 * rule other than an `evenWithGrant` rule matched.
 */
export function evaluateCommand(
  command,
  { policy = loadPolicy(), allowance = () => releaseTierAllowance({ policy }), raw = command } = {},
) {
  const context = { policy, views: [], scripts: [] };
  collect(command, context, 0);
  const breaks = (rule) => {
    const pattern = new RegExp(rule.pattern);
    const unless = rule.unless && new RegExp(rule.unless);
    const texts = rule.anywhere ? [raw] : context.views;
    return texts.some((text) => pattern.test(text) && !unless?.test(text));
  };
  const lifting = policy.deny.find((rule) => rule.evenWithGrant && breaks(rule));
  if (lifting) return { rule: lifting.id, instead: lifting.instead };
  const { validateModes, instead } = policy.releaseTier;
  const release = context.scripts.find(({ name }) => commandTier(policy, name) === 'release');
  const unfiltered = context.scripts.find(({ name, args }) => !satisfiesFilter(name, args, policy));
  const denied = policy.deny.find((rule) => !rule.evenWithGrant && breaks(rule));
  const [releaseMode] = context.scripts
    .filter(({ name }) => name.startsWith('validate'))
    .flatMap(({ name, args }) => args.filter((arg) => validateModes.includes(arg)).map((mode) => `${name} ${mode}`));
  const verdict =
    (release && { rule: `release-tier:${release.name}`, instead }) ||
    (unfiltered && { rule: `filtered-only:${unfiltered.name}`, instead: policy.filteredOnly.instead }) ||
    (denied && { rule: denied.id, instead: denied.instead }) ||
    (releaseMode && { rule: `release-tier:${releaseMode}`, instead });
  return verdict && !allowance().allowed ? verdict : null;
}

// Malformed input or an internal error allows the command: the script-level guard is the fail-closed backstop,
// and a broken hook must not stop every shell command.
async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  try {
    const event = JSON.parse(input);
    const { command, file_path: filePath, notebook_path: notebookPath } = event.tool_input ?? {};
    const raw = [command, filePath, notebookPath].find((value) => typeof value === 'string');
    if (raw === undefined) return;
    const policy = loadPolicy(checkoutRoot);
    const verdict = evaluateCommand(typeof command === 'string' ? command : '', {
      policy,
      allowance: () => releaseTierAllowance({ cwd: checkoutRoot, policy }),
      raw,
    });
    if (!verdict) return;
    const log = path.join(checkoutRoot, '.codex-artifacts', 'feedback-guard', 'denials.jsonl');
    mkdirSync(path.dirname(log), { recursive: true });
    appendFileSync(
      log,
      `${JSON.stringify({ time: new Date().toISOString(), rule: verdict.rule, session: event.session_id ?? null, command: raw.slice(0, 300) })}\n`,
    );
    appendHistory(
      { kind: 'denial', rule: verdict.rule, session: event.session_id ?? null },
      { cwd: checkoutRoot, policy },
    );
    process.stderr.write(`Feedback guard denied this command (${verdict.rule}). ${verdict.instead}\n`);
    process.exitCode = 2;
  } catch (error) {
    process.stderr.write(`Feedback command guard skipped: ${error.message}\n`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
