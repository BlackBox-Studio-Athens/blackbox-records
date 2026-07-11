import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const buildRoot = path.join(webRoot, 'dist');
const holdingRoot = path.join(webRoot, 'dist-holding');
const holdingDocument = path.join(buildRoot, 'prd-holding', 'index.html');
const staticCopiedPaths = [
  'assets/fonts/brand/veneer.css',
  'assets/fonts/brand/veneer_regular.woff2',
  'assets/images/brand/logo.png',
  'favicon.svg',
  'favicon-96x96.png',
  'favicon.ico',
] as const;

if (!existsSync(holdingDocument)) {
  throw new Error(`Required PRD Holding Page build output is missing: ${holdingDocument}`);
}

rmSync(holdingRoot, { force: true, recursive: true });
mkdirSync(holdingRoot, { recursive: true });

const builtHtml = readFileSync(holdingDocument, 'utf8');
const scripts = builtHtml.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
if (
  scripts.length > 1 ||
  scripts.some((script) => !/^<script type="module" src="\/_astro\/page\.[^"]+\.js"><\/script>$/.test(script))
) {
  throw new Error('PRD Holding Page contains an unexpected script.');
}
const holdingHtml = scripts[0] ? builtHtml.replace(scripts[0], '') : builtHtml;
writeFileSync(path.join(holdingRoot, 'index.html'), holdingHtml);
writeFileSync(path.join(holdingRoot, '404.html'), holdingHtml);

const astroAssets = new Set<string>();
const pendingCssAssets: string[] = [];
function addAstroAsset(value: string, baseUrl = 'https://holding.local/'): void {
  const url = new URL(value, baseUrl);
  const relativePath = decodeURIComponent(url.pathname).replace(/^\//, '');
  if (url.origin !== 'https://holding.local' || !relativePath.startsWith('_astro/') || astroAssets.has(relativePath)) {
    return;
  }

  astroAssets.add(relativePath);
  if (relativePath.endsWith('.css')) pendingCssAssets.push(relativePath);
}

for (const tag of holdingHtml.match(/<(?:img|link|source)\b[^>]*>/gi) ?? []) {
  for (const match of tag.matchAll(/\b(?:href|src)="([^"]+)"/gi)) addAstroAsset(match[1]!);
  for (const match of tag.matchAll(/\bsrcset="([^"]+)"/gi)) {
    for (const candidate of match[1]!.split(',')) addAstroAsset(candidate.trim().split(/\s+/)[0]!);
  }
}

for (const relativePath of pendingCssAssets) {
  const css = readFileSync(path.join(buildRoot, relativePath), 'utf8');
  const cssUrl = new URL(`/${relativePath}`, 'https://holding.local/').toString();
  for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) addAstroAsset(match[1]!, cssUrl);
}

const copiedPaths = [...staticCopiedPaths, ...astroAssets];
for (const relativePath of copiedPaths) {
  const source = path.join(buildRoot, relativePath);
  if (!existsSync(source)) throw new Error(`Required PRD Holding Page asset is missing: ${source}`);

  const destination = path.join(holdingRoot, relativePath);
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination);
}

writeFileSync(
  path.join(holdingRoot, '_headers'),
  `/*
  X-Robots-Tag: noindex, nofollow
  Cache-Control: no-transform
  Content-Security-Policy: default-src 'self'; connect-src 'none'; font-src 'self'; frame-src 'none'; img-src 'self'; object-src 'none'; script-src 'none'; style-src 'self' 'unsafe-inline'; base-uri 'none'; form-action 'none'
  Referrer-Policy: strict-origin-when-cross-origin
  X-Content-Type-Options: nosniff

/_astro/*
  Cache-Control: public, max-age=31536000, immutable
`,
);

console.log(`Prepared PRD Holding Page artifact at ${holdingRoot}.`);
