import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

import { dynamicImportSpecifiers } from './runtime-performance-helpers';

const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.join('=') || 'true'];
  }),
);
const scope = args.get('scope') ?? 'web';
if (scope !== 'web' && scope !== 'staff')
  throw new Error(`Unknown bundle graph scope "${scope}". Use "web" or "staff".`);
const distRoot = resolve(args.get('dist') ?? (scope === 'staff' ? 'apps/staff/dist' : 'apps/web/dist'));
const output = args.get('output');
const routeDocuments = {
  home: 'index.html',
  artists: 'artists/index.html',
  services: 'services/index.html',
  store: 'store/index.html',
};
const eagerGraphBudgetBytes = 95 * 1024;
const dormantPortalNames = ['ArtistsRosterFilters', 'ServicesInquiryForm', 'StoreCartButton'];
const staffRouteDocuments = {
  overview: { document: 'index.html', javascriptBudgetBytes: 118784 },
  website: { document: 'content/index.html', javascriptBudgetBytes: 168960 },
  stock: { document: 'stock/index.html', javascriptBudgetBytes: 148480 },
  orders: { document: 'orders/index.html', javascriptBudgetBytes: 122880 },
};
const staffHtmlBudgetBytes = 24576;

function localAssetPath(url: string) {
  const marker = '/_astro/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) return null;
  return join(distRoot, url.slice(markerIndex + 1));
}

function attributeValue(tag: string, name: string) {
  const match = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? '';
}

function staffProjectStylesheetUrls(html: string) {
  const urls = new Set<string>();
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!attributeValue(tag, 'rel').toLowerCase().split(/\s+/).includes('stylesheet')) continue;
    const href = attributeValue(tag, 'href');
    if (!href) continue;
    try {
      const url = new URL(href, 'https://staff.blackboxrecordsathens.com');
      if (url.origin === 'https://staff.blackboxrecordsathens.com' && url.pathname.startsWith('/_astro/'))
        urls.add(href);
    } catch {
      // Ignore malformed or non-project stylesheet URLs.
    }
  }
  return [...urls];
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
  return dynamicImportSpecifiers(readFileSync(file, 'utf8'));
}

function brotliBytes(bytes: Buffer) {
  return brotliCompressSync(bytes, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).length;
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
      brotliBytes: brotliBytes(bytes),
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

if (scope === 'staff') {
  const diagnostics: string[] = [];
  const routes = Object.fromEntries(
    Object.entries(staffRouteDocuments).map(([route, { document, javascriptBudgetBytes }]) => {
      const routeDiagnostics: string[] = [];
      const documentPath = join(distRoot, document);
      let html: Buffer;
      try {
        html = readFileSync(documentPath);
      } catch {
        routeDiagnostics.push(`Missing ${route} document ${documentPath}; run "pnpm build:staff" first.`);
        diagnostics.push(...routeDiagnostics);
        return [
          route,
          {
            document,
            javascriptBudgetBytes,
            htmlBudgetBytes: staffHtmlBudgetBytes,
            eagerEntries: [],
            eagerGraph: null,
            htmlRawBytes: null,
            htmlBrotliBytes: null,
            projectStylesheetUrls: [],
            diagnostics: routeDiagnostics,
          },
        ];
      }

      const markup = html.toString('utf8');
      const projectStylesheetUrls = staffProjectStylesheetUrls(markup);
      if (projectStylesheetUrls.length > 0) {
        routeDiagnostics.push(
          `${route} has initial project stylesheet links: ${projectStylesheetUrls.join(', ')}; inline initial project styles.`,
        );
      }

      const eagerEntries = initialEntries(markup);
      let eagerGraph: ReturnType<typeof summarize> | null = null;
      if (eagerEntries.length === 0) {
        routeDiagnostics.push(`${route} has no discoverable initial JavaScript entries in ${documentPath}.`);
      } else {
        try {
          eagerGraph = summarize(closure(eagerEntries));
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          routeDiagnostics.push(
            `${route} eager graph references an unreadable asset: ${detail}; rebuild staff and inspect its module references.`,
          );
        }
      }
      const htmlBrotliBytes = brotliBytes(html);
      if (htmlBrotliBytes > staffHtmlBudgetBytes) {
        routeDiagnostics.push(`${route} HTML is ${htmlBrotliBytes} Brotli bytes (budget ${staffHtmlBudgetBytes}).`);
      }
      if (eagerGraph && eagerGraph.brotliBytes > javascriptBudgetBytes) {
        routeDiagnostics.push(
          `${route} eager JavaScript is ${eagerGraph.brotliBytes} Brotli bytes (budget ${javascriptBudgetBytes}).`,
        );
      }
      diagnostics.push(...routeDiagnostics);
      return [
        route,
        {
          document,
          javascriptBudgetBytes,
          htmlBudgetBytes: staffHtmlBudgetBytes,
          eagerEntries: eagerEntries.map((file) => relative(distRoot, file).replaceAll('\\', '/')),
          eagerGraph,
          htmlRawBytes: html.length,
          htmlBrotliBytes,
          projectStylesheetUrls,
          diagnostics: routeDiagnostics,
        },
      ];
    }),
  );
  const report = { scope, distRoot, htmlBudgetBytes: staffHtmlBudgetBytes, routes, diagnostics };
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
} else {
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
  const shellDynamicEntries = shell
    ? shell.files.flatMap((row) =>
        row.dynamicImports
          .filter((specifier) => specifier.startsWith('.'))
          .map((specifier) => fileURLToPath(new URL(specifier, pathToFileURL(join(distRoot, row.file))))),
      )
    : [];
  const storeCartEntry = shellDynamicEntries.find((file) => /[\\/]store-cart\.[^\\/]+\.js$/.test(file));
  const storeCart = storeCartEntry ? summarize(closure([storeCartEntry])) : null;
  const diagnostics: string[] = [];
  if (routes.home.graph.brotliBytes > eagerGraphBudgetBytes) {
    diagnostics.push(`Home eager graph is ${routes.home.graph.brotliBytes} bytes (budget ${eagerGraphBudgetBytes}).`);
  }
  if (!shell || shell.brotliBytes > eagerGraphBudgetBytes) {
    diagnostics.push(
      `Shell eager graph is ${shell?.brotliBytes ?? 'missing'} bytes (budget ${eagerGraphBudgetBytes}).`,
    );
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
}
