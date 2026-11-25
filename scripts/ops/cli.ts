import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { CommanderError } from 'commander';
import { createStaffClient, staffOrigin } from './access';
import { OpsError, parseCommand, type WriteCommand } from './arguments';
import { artworkUpload } from './artwork';
import { setStock, setUpDistro } from './staff-operations';

async function ask(question: string): Promise<string> {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await terminal.question(question, { signal: AbortSignal.timeout(120_000) });
  } catch {
    return '';
  } finally {
    terminal.close();
  }
}

function writePlan(command: WriteCommand, operationId: string): string {
  const { apply, confirmLive, yes, env, ...intent } = command;
  const details =
    intent.action === 'stock set'
      ? { ...intent, onlineCopies: 'Physical copies minus copies already sold and awaiting shipment, minimum zero.' }
      : { ...intent, price: `EUR ${(intent.price / 100).toFixed(2)}` };
  return JSON.stringify(
    {
      mode: apply ? 'apply' : 'dry run',
      env,
      origin: staffOrigin(env),
      operationId,
      confirmLive,
      confirmation: apply && yes ? '--yes' : 'typed',
      ...details,
    },
    null,
    2,
  ).replace(
    /[\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`,
  );
}

export async function runOps(
  args: string[],
  {
    clientFor = createStaffClient,
    report = console.log,
    reportError = console.error,
    interactive = !!(process.stdin.isTTY && process.stdout.isTTY),
    prompt = ask,
  } = {},
): Promise<number> {
  try {
    const command = parseCommand(args, {
      writeOut: (output) => report(output.trimEnd()),
      writeErr: (output) => reportError(output.trimEnd()),
    });
    if (command.action === 'login') {
      report(`Complete ${command.env.toUpperCase()} Access sign-in in the browser cloudflared opens.`);
      await clientFor(command.env).login();
      report(`Access login completed for ${command.env.toUpperCase()}.`);
      return 0;
    }
    if (command.action === 'whoami') {
      report(`${command.env.toUpperCase()} operator ${await clientFor(command.env).whoami()}.`);
      return 0;
    }

    const operationId = randomUUID();
    report(writePlan(command, operationId));
    if (command.apply && command.env === 'prd' && !command.confirmLive) {
      throw new OpsError('Applying to PRD requires --confirm-live.');
    }
    if (command.apply && !command.yes && !interactive) throw new OpsError('Applying requires an interactive terminal.');
    const artwork = command.action === 'distro create' ? await artworkUpload(command.image) : undefined;
    if (!command.apply) return 0;

    const confirmation = command.env.toUpperCase();
    if (!command.yes && (await prompt(`Type ${confirmation} to apply: `)) !== confirmation) {
      throw new OpsError('Confirmation did not match. Write cancelled.');
    }
    const client = clientFor(command.env);
    const completed =
      command.action === 'stock set'
        ? await setStock(client, command, operationId, report)
        : await setUpDistro(client, command, artwork, operationId, report);
    return completed ? 0 : 1;
  } catch (error) {
    if (error instanceof CommanderError) return error.exitCode;
    reportError(error instanceof OpsError ? error.message : 'Operator command failed.');
    return 1;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  void runOps(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  });
}
