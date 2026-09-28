import { createHash } from 'node:crypto';
import { execa } from 'execa';
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const require = createRequire(import.meta.url);
const identityFiles = ['package.json', 'pnpm-lock.yaml', 'prettier.config.mjs', '.prettierignore', '.editorconfig'];

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesUnder(filename)));
    else if (entry.isFile()) files.push(filename);
  }
  return files;
}

export async function formatCacheIdentity(cwd = root) {
  const pluginManifest = require.resolve('prettier-plugin-astro/package.json', { paths: [cwd] });
  const pluginFiles = await filesUnder(path.dirname(pluginManifest));
  const files = [...identityFiles.map((file) => path.join(cwd, file)), ...pluginFiles].sort();
  const hash = createHash('sha256');
  for (const filename of files) {
    const relative = path.relative(cwd, filename).replaceAll(path.sep, '/');
    const bytes = await readFile(filename).catch((error) => {
      throw new Error(`Formatting cache identity input is unavailable: ${relative} (${error.code ?? error.message}).`);
    });
    hash.update(relative);
    hash.update('\0');
    hash.update(bytes);
    hash.update('\0');
  }
  hash.update(`experimental-cli\0${process.version}\0${process.platform}\0${process.arch}`);
  return hash.digest('hex');
}

export async function formatCacheLocation(cwd = root) {
  const identity = await formatCacheIdentity(cwd);
  return path.join(cwd, 'node_modules', '.cache', 'blackbox-validation', `prettier-${identity}.cache`);
}

async function runPrettier(cwd, args, { files = ['.'], write = false } = {}) {
  const manifestPath = require.resolve('prettier/package.json', { paths: [cwd, root] });
  const { bin } = require(manifestPath);
  const executable = path.resolve(path.dirname(manifestPath), typeof bin === 'string' ? bin : bin.prettier);
  return execa(process.execPath, [executable, ...files, write ? '--write' : '--check', '--experimental-cli', ...args], {
    cwd,
    stdio: 'inherit',
  });
}

export async function runFormatCheck({ cwd = root, uncached = false, write = false, files = ['.'] } = {}) {
  if (uncached) return runPrettier(cwd, ['--no-cache'], { files, write });
  const cache = await formatCacheLocation(cwd);
  await stat(path.dirname(cache)).catch(async (error) => {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(path.dirname(cache), { recursive: true });
  });
  try {
    return await runPrettier(cwd, ['--cache', '--cache-location', cache], { files, write });
  } catch (error) {
    const output = String(error?.stderr ?? '');
    if (!/(?:cache.*(?:invalid|corrupt|parse|json|read)|(?:invalid|corrupt|parse|json|read).*cache)/i.test(output))
      throw error;
    await rm(cache, { force: true });
    return runPrettier(cwd, ['--no-cache'], { files, write });
  }
}

function parseArguments(args) {
  const options = { files: [] };
  for (const arg of args) {
    if (arg === '--write') options.write = true;
    else if (arg === '--uncached') options.uncached = true;
    else if (arg.startsWith('-')) throw new Error(`Unexpected option: ${arg}`);
    else options.files.push(arg);
  }
  if (options.files.length === 0) options.files.push('.');
  return options;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const run = async () => runFormatCheck(parseArguments(process.argv.slice(2)));
  run().catch((error) => {
    console.error(error.shortMessage ?? error.message);
    process.exitCode = error.exitCode ?? 1;
  });
}
