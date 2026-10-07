import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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
const documentsRoot = resolve(args.get('documents') ?? distRoot);
for (const [label, root] of [
  ['Document', documentsRoot],
  ['Client asset', distRoot],
]) {
  if (!statSync(root!).isDirectory()) throw new Error(`${label} directory is missing: ${root}`);
}
const output = args.get('output');
const routeDocuments = {
  home: 'index.html',
  artists: 'artists/index.html',
  services: 'services/index.html',
  store: 'store/index.html',
};
// React 19.3 plus Lenis/Motion lifecycle wiring; libraries and dormant surfaces remain lazy.
// Measured migration output and prior budget: openspec/changes/adopt-lenis-motion-frontends/design.md.
// User-approved 2 KiB allowance (6 October 2026): Store Item pages sat 24 bytes under 100 KiB, so any shared byte
// failed releases. Pages stay where they were; only the headroom grows.
const eagerGraphBudgetBytes = 102 * 1024;
// User-approved 3 KiB Home allowance for the current preorder and inquiry release, plus 1 KiB approved on
// 7 October 2026 for the swipe-row dots island (795 Brotli bytes; openspec/changes/add-home-swipe-rows).
const homeEagerGraphBudgetBytes = 104 * 1024;
const dormantPortalNames = ['ArtistsRosterFilters', 'ServicesInquiryForm', 'StoreCartButton', 'StoreImageGallery'];
const staffRouteDocuments = {
  overview: { document: 'index.html', javascriptBudgetBytes: 121 * 1024 },
  website: { document: 'content/index.html', javascriptBudgetBytes: 176128 },
  // Calendar navigation and focused stock controls add at most 2 KiB to the existing staff budgets.
  stock: { document: 'stock/index.html', javascriptBudgetBytes: 152 * 1024 },
  orders: { document: 'orders/index.html', javascriptBudgetBytes: 126 * 1024 },
  calendar: { document: 'calendar/index.html', javascriptBudgetBytes: 176128 },
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
      const documentPath = join(documentsRoot, document);
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
  const report = { scope, distRoot, documentsRoot, htmlBudgetBytes: staffHtmlBudgetBytes, routes, diagnostics };
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
  // Select actual built item routes so catalog slug changes do not silently remove coverage.
  const itemDocuments = readdirSync(join(documentsRoot, 'store'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `store/${entry.name}/index.html`)
    .toSorted()
    .flatMap((document) => {
      try {
        const html = readFileSync(join(documentsRoot, document), 'utf8');
        return /class=["'][^"']*\bstore-item-page\b/.test(html)
          ? [{ document, gallery: /\bdata-store-image-gallery\b|class=["']store-image-gallery["']/.test(html) }]
          : [];
      } catch {
        return [];
      }
    });
  const diagnostics: string[] = [];
  const singleItem = itemDocuments.find((item) => !item.gallery);
  const galleryItem = itemDocuments.find((item) => item.gallery);
  if (!singleItem)
    diagnostics.push('Missing a built single-image Store Item page; item-route budget coverage is incomplete.');
  if (!galleryItem)
    diagnostics.push('Missing a built gallery Store Item page; gallery-route budget coverage is incomplete.');
  // Both item classes use the public 102 KiB budget. A measured exception requires a recorded decision.
  const documents = {
    ...routeDocuments,
    ...(args.has('documents')
      ? {
          storeCategory: 'store/distro/index.html',
          news: 'news/index.html',
          releases: 'releases/index.html',
          ...Object.fromEntries(
            ['artists', 'releases', 'news'].flatMap((section) =>
              readdirSync(join(documentsRoot, section), { withFileTypes: true })
                .filter((entry) => entry.isDirectory())
                .map((entry) => [`${section}/${entry.name}`, `${section}/${entry.name}/index.html`]),
            ),
          ),
        }
      : {}),
    ...(singleItem ? { storeItem: singleItem.document } : {}),
    ...(galleryItem ? { storeGalleryItem: galleryItem.document } : {}),
  };
  const routes = Object.fromEntries(
    Object.entries(documents).map(([route, document]) => {
      const html = readFileSync(join(documentsRoot, document), 'utf8');
      return [
        route,
        {
          document,
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
  if (!shell || shell.brotliBytes > eagerGraphBudgetBytes) {
    diagnostics.push(
      `Shell eager graph is ${shell?.brotliBytes ?? 'missing'} bytes (budget ${eagerGraphBudgetBytes}).`,
    );
  }
  for (const [route, result] of Object.entries(routes)) {
    if (result.graph.fileCount === 0) {
      diagnostics.push(`${route} has no discoverable eager JavaScript entries; route budget coverage is incomplete.`);
    }
    const budget = route === 'home' ? homeEagerGraphBudgetBytes : eagerGraphBudgetBytes;
    if (result.graph.brotliBytes > budget) {
      diagnostics.push(`${route} eager graph is ${result.graph.brotliBytes} bytes (budget ${budget}).`);
    }
    const dormantFiles = result.graph.files.filter((row) => dormantPortalNames.some((name) => row.file.includes(name)));
    if (dormantFiles.length > 0) {
      diagnostics.push(`${route} eagerly includes dormant portals: ${dormantFiles.map((row) => row.file).join(', ')}.`);
    }
  }
  if (args.has('documents')) {
    // strictExecutionOrder belongs to SSR only. Inspect all client chunks, including dormant island entries.
    for (const file of readdirSync(join(distRoot, '_astro')).filter((file) => file.endsWith('.js'))) {
      const source = readFileSync(join(distRoot, '_astro', file), 'utf8');
      if (/\b__esm(?:Min)?\b|\b__init_\w+\b/.test(source))
        diagnostics.push(`Hosted client chunk ${file} contains an SSR execution-order wrapper.`);
    }
  }
  const report = {
    distRoot,
    documentsRoot,
    eagerGraphBudgetBytes,
    homeEagerGraphBudgetBytes,
    routes,
    shell,
    storeCart,
    diagnostics,
  };
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
