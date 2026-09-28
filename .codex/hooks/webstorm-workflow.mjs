import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function applyHookEvent(event) {
  const name = event.hook_event_name || event.hookEventName;
  if (name !== 'UserPromptSubmit') return null;
  return {
    hookSpecificOutput: {
      hookEventName: name,
      additionalContext:
        'Use native apply_patch for ordinary edits. Use WebStorm MCP only for large-scale refactoring across many files or modules where semantic tools provide a concrete benefit; within that scope use rename_refactoring for code-symbol renames when available for the target project. Routine edits, small renames, reads, searches, and checks use native tools, the graph workflow, and shell commands. Missing patch/delete tools, unsupported workspace paths, or failed IDE operations do not block the task: inspect any partial changes, then use native apply_patch or scoped filesystem commands and verify affected references.',
    },
  };
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  const output = applyHookEvent(JSON.parse(input || '{}'));
  if (output) process.stdout.write(JSON.stringify(output));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch(() => {
    process.stderr.write('WebStorm edit guidance hook failed.\n');
    process.exit(2);
  });
