import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.join('=') || 'true'];
  }),
);
const distRoot = resolve(args.get('dist') ?? 'apps/web/dist');
const output = args.get('output');
const routeDocuments = {
  home: 'index.html',
  artists: 'artists/index.html',
  services: 'services/index.html',
  store: 'store/index.html',
};
const eagerGraphBudgetBytes = 95 * 1024;
const dormantPortalNames = ['ArtistsRosterFilters', 'ServicesInquiryForm', 'StoreCartButton'];

function localAssetPath(url: string) {
  const marker = '/_astro/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) return null;
  return join(distRoot, url.slice(markerIndex + 1));
}

function initialEntries(html: string) {
  const entries = new Set<string>();
  for (const match of html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+\.js)"/g)) {
    const asset = localAssetPath(match[1]);
    if (asset) entries.add(asset);
  }
  for (const match of html.matchAll(/<astro-island\b([^>]*)>/g)) {
    const attributes = match[1];
    if (!/\bclient="load"/.test(attributes)) continue;
    for (const attribute of ['component-url', 'renderer-url']) {
      const value = new RegExp(`${attribute}="([^"]+\\.js)"`).exec(attributes)?.[1];
      const asset = value ? localAssetPath(value) : null;
      if (asset) entries.add(asset);
    }
  }
  return [...entries];
}

function staticImports(file: string) {
  const source = readFileSync(file, 'utf8');
  const imports = new Set<string>();
  const patterns = [
    /\bimport\s*["']([^"']+\.js)["']/g,
    /\bimport(?!\s*\()[^;]*?\bfrom\s*["']([^"']+\.js)["']/g,
    /\bexport[^;]*?\bfrom\s*["']([^"']+\.js)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (!match[1].startsWith('.')) continue;
      imports.add(fileURLToPath(new URL(match[1], pathToFileURL(file))));
    }
  }
  return [...imports];
}

function dynamicImports(file: string) {
  const source = readFileSync(file, 'utf8');
  return [...source.matchAll(/\bimport\(\s*["']([^"']+\.js)["']\s*\)/g)].map((match) => match[1]);
}

function closure(entries: string[]) {
  const files = new Set<string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (files.has(file)) continue;
    files.add(file);
    queue.push(...staticImports(file));
  }
  return [...files].toSorted();
}

function summarize(files: string[]) {
  const rows = files.map((file) => {
    const bytes = readFileSync(file);
    return {
      file: relative(distRoot, file).replaceAll('\\', '/'),
      rawBytes: bytes.length,
      brotliBytes: brotliCompressSync(bytes, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
      }).length,
      dynamicImports: dynamicImports(file),
    };
  });
  return {
    fileCount: rows.length,
    rawBytes: rows.reduce((total, row) => total + row.rawBytes, 0),
    brotliBytes: rows.reduce((total, row) => total + row.brotliBytes, 0),
    files: rows,
  };
}

const routes = Object.fromEntries(
  Object.entries(routeDocuments).map(([route, document]) => {
    const html = readFileSync(join(distRoot, document), 'utf8');
    return [
      route,
      {
        graph: summarize(closure(initialEntries(html))),
        thirdPartyScripts: [...html.matchAll(/<script[^>]+src="(https?:\/\/[^"]+)"/g)].map((match) => match[1]),
      },
    ];
  }),
);
const homeFiles = routes.home.graph.files;
const shellEntry = homeFiles.find((row) => row.file.includes('_astro/AppShellRoot.'));
const shell = shellEntry ? summarize(closure([join(distRoot, shellEntry.file)])) : null;
const storeCartEntry = homeFiles.find((row) => row.file.includes('_astro/store-cart.'));
const storeCart = storeCartEntry ? summarize(closure([join(distRoot, storeCartEntry.file)])) : null;
const diagnostics: string[] = [];
if (routes.home.graph.brotliBytes > eagerGraphBudgetBytes) {
  diagnostics.push(`Home eager graph is ${routes.home.graph.brotliBytes} bytes (budget ${eagerGraphBudgetBytes}).`);
}
if (!shell || shell.brotliBytes > eagerGraphBudgetBytes) {
  diagnostics.push(`Shell eager graph is ${shell?.brotliBytes ?? 'missing'} bytes (budget ${eagerGraphBudgetBytes}).`);
}
for (const [route, result] of Object.entries(routes)) {
  const dormantFiles = result.graph.files.filter((row) => dormantPortalNames.some((name) => row.file.includes(name)));
  if (dormantFiles.length > 0) {
    diagnostics.push(`${route} eagerly includes dormant portals: ${dormantFiles.map((row) => row.file).join(', ')}.`);
  }
}
const report = { distRoot, eagerGraphBudgetBytes, routes, shell, storeCart, diagnostics };
const json = `${JSON.stringify(report, null, 2)}\n`;
if (output) {
  const outputPath = resolve(output);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, json);
  console.log(output);
} else {
  console.log(json);
}
if (diagnostics.length > 0) throw new Error(diagnostics.join('\n'));
