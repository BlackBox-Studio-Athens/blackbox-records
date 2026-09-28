import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_DOCUMENTS = ['AGENTS.md', 'docs/agent-workflow.md', 'docs/agent-reference.md'];
const CODE_SPAN = /(`+)(.*?)\1/g;
const INLINE_LINK = /!?\[[^\]]*\]\(\s*(?:<([^>]+)>|((?:\\.|[^()\s]|\([^)]*\))*))/g;
const PNPM_BUILTINS = new Set(['install', 'exec']);

// ponytail: single-line CommonMark subset; use a Markdown parser if guidance needs multiline spans or deeper nested destinations.
const diagnostic = (file, line, message) => `${file}:${line}: ${message}`;

function rootScript(command) {
  const [executable, first, second] = command.trim().split(/\s+/);
  if (
    executable !== 'pnpm' ||
    !first ||
    first === '--filter' ||
    first.startsWith('--filter=') ||
    first === '-C' ||
    first.startsWith('-C') ||
    PNPM_BUILTINS.has(first)
  )
    return null;
  if (first === 'run') return second && !second.startsWith('-') ? second : null;
  return first.startsWith('-') ? null : first;
}

function isExternal(target) {
  return (
    target.startsWith('#') ||
    target.startsWith('//') ||
    (!path.isAbsolute(target) && /^[a-z][a-z0-9+.-]*:/i.test(target))
  );
}

function jsonErrorLine(source, error) {
  const position = /position (\d+)/i.exec(error.message);
  if (position) return source.slice(0, Number(position[1])).split(/\r\n|\r|\n/).length;
  return Number(/line (\d+)/i.exec(error.message)?.[1] ?? 1);
}

export async function checkAgentGuidance({ cwd = process.cwd(), documents = DEFAULT_DOCUMENTS } = {}) {
  if (typeof cwd !== 'string' || !cwd.trim()) return [diagnostic('input', 1, 'cwd must be a non-empty path.')];
  if (
    !Array.isArray(documents) ||
    !documents.length ||
    documents.some((file) => typeof file !== 'string' || !file.trim())
  ) {
    return [diagnostic('input', 1, 'documents must be a non-empty array of file paths.')];
  }

  const root = path.resolve(cwd);
  let packageSource;
  try {
    packageSource = await readFile(path.join(root, 'package.json'), 'utf8');
  } catch (error) {
    return [
      diagnostic(
        'package.json',
        1,
        `cannot read root package.json (${error.message}); run the checker from the repository root.`,
      ),
    ];
  }

  let scripts;
  try {
    const packageJson = JSON.parse(packageSource);
    if (
      !packageJson ||
      typeof packageJson !== 'object' ||
      Array.isArray(packageJson) ||
      !packageJson.scripts ||
      typeof packageJson.scripts !== 'object' ||
      Array.isArray(packageJson.scripts)
    ) {
      return [
        diagnostic(
          'package.json',
          1,
          'missing root scripts object; add package.json scripts before checking documented commands.',
        ),
      ];
    }
    scripts = packageJson.scripts;
  } catch (error) {
    return [
      diagnostic(
        'package.json',
        jsonErrorLine(packageSource, error),
        `invalid JSON (${error.message}); fix package.json syntax before checking documented commands.`,
      ),
    ];
  }

  const diagnostics = [];
  for (const document of documents) {
    const file = path.resolve(root, document);
    const label = path.relative(root, file).split(path.sep).join('/') || path.basename(file);
    let source;
    try {
      source = await readFile(file, 'utf8');
    } catch (error) {
      diagnostics.push(
        diagnostic(label, 1, `cannot read document (${error.message}); create the file or correct its path.`),
      );
      continue;
    }

    const lines = source.split(/\r\n|\r|\n/);
    const lineCount = lines.length - Number(source.endsWith('\n') || source.endsWith('\r'));
    if (path.basename(file).toLowerCase() === 'agents.md' && lineCount > 120) {
      diagnostics.push(
        diagnostic(label, 121, `has ${lineCount} lines (maximum 120); move detail into linked guidance documents.`),
      );
    }

    let fence;
    for (const [index, line] of lines.entries()) {
      const opening = /^ {0,3}(`{3,}|~{3,})/.exec(line);
      if (fence) {
        const closing = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line)?.[1];
        if (closing && closing[0] === fence[0] && closing.length >= fence.length) fence = undefined;
        else {
          const script = rootScript(line);
          if (script && !Object.hasOwn(scripts, script))
            diagnostics.push(
              diagnostic(
                label,
                index + 1,
                `unknown root pnpm script "${script}"; add it to package.json or correct the command.`,
              ),
            );
        }
        continue;
      }
      if (opening) {
        fence = opening[1];
        continue;
      }

      for (const match of line.matchAll(CODE_SPAN)) {
        const script = rootScript(match[2]);
        if (script && !Object.hasOwn(scripts, script))
          diagnostics.push(
            diagnostic(
              label,
              index + 1,
              `unknown root pnpm script "${script}"; add it to package.json or correct the command.`,
            ),
          );
      }
      const markdown = line.replace(CODE_SPAN, (span) => ' '.repeat(span.length));
      for (const match of markdown.matchAll(INLINE_LINK)) {
        const rawTarget = match[1] ?? match[2] ?? '';
        if (!rawTarget || isExternal(rawTarget)) continue;
        let target;
        try {
          target = decodeURIComponent(rawTarget.split('#', 1)[0]);
        } catch (error) {
          diagnostics.push(
            diagnostic(
              label,
              index + 1,
              `invalid URI encoding in local link "${rawTarget}" (${error.message}); correct the target encoding.`,
            ),
          );
          continue;
        }
        if (!target || isExternal(target)) continue;
        try {
          await stat(path.resolve(path.dirname(file), target));
        } catch {
          diagnostics.push(
            diagnostic(
              label,
              index + 1,
              `local link target does not exist: "${rawTarget}"; create the target or correct the link.`,
            ),
          );
        }
      }
    }
  }
  return diagnostics;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const diagnostics = await checkAgentGuidance();
  if (diagnostics.length) {
    console.error(diagnostics.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Agent guidance OK (${DEFAULT_DOCUMENTS.length} documents).`);
  }
}
