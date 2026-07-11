import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(webRoot, '../..');
const holdingRoot = path.join(webRoot, 'dist-holding');
const canonicalUrl = 'https://blackboxrecordsathens.com/';
const canonicalOrigin = new URL(canonicalUrl).origin;
const referencedFiles = new Set<string>();
const allowedImageFiles = new Set(['assets/images/brand/logo.png', 'favicon-96x96.png', 'favicon.ico', 'favicon.svg']);
const requiredFiles = new Set([
  '404.html',
  '_headers',
  'assets/fonts/brand/veneer.css',
  'assets/fonts/brand/veneer_regular.woff2',
  'assets/images/brand/logo.png',
  'favicon-96x96.png',
  'favicon.ico',
  'favicon.svg',
  'index.html',
]);

function listFiles(directory: string, prefix = ''): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? listFiles(path.join(directory, entry.name), relativePath) : relativePath;
  });
}

function localPathFromUrl(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue || trimmedValue.startsWith('data:')) return null;

  const url = new URL(trimmedValue, canonicalUrl);
  if (url.origin !== canonicalOrigin) {
    throw new Error(`Third-party page-load URL found: ${trimmedValue}`);
  }

  return decodeURIComponent(url.pathname).replace(/^\//, '');
}

function checkLocalAsset(value: string): void {
  const relativePath = localPathFromUrl(value);
  if (relativePath) {
    referencedFiles.add(relativePath);
    if (!existsSync(path.join(holdingRoot, relativePath))) throw new Error(`Missing same-origin asset: ${value}`);
  }
}

if (!existsSync(holdingRoot)) {
  throw new Error(`PRD Holding Page artifact not found at ${holdingRoot}. Run pnpm prd:holding:prepare first.`);
}

const files = listFiles(holdingRoot);
const htmlFiles = files.filter((file) => file.endsWith('.html'));
if (htmlFiles.join('\n') !== ['404.html', 'index.html'].join('\n')) {
  throw new Error(`Unexpected HTML files in PRD Holding Page artifact: ${htmlFiles.join(', ') || '(none)'}`);
}

for (const requiredFile of requiredFiles) {
  if (!files.includes(requiredFile)) throw new Error(`Missing required PRD Holding Page file: ${requiredFile}`);
}

const indexHtml = readFileSync(path.join(holdingRoot, 'index.html'), 'utf8');
const notFoundHtml = readFileSync(path.join(holdingRoot, '404.html'), 'utf8');
if (notFoundHtml !== indexHtml) throw new Error('PRD Holding Page 404 document must match index.html.');

const requiredMarkup = [
  `<link rel="canonical" href="${canonicalUrl}">`,
  `<meta property="og:url" content="${canonicalUrl}">`,
  '<meta name="robots" content="noindex, nofollow">',
  'UNDER CONSTRUCTION.',
  'BLACKBOX RECORDS IS ACTIVE.',
  'FOLLOW ON INSTAGRAM',
  'EMAIL THE LABEL',
  'href="https://www.instagram.com/blackboxrecordsath/"',
  'href="mailto:info@blackboxrecordsathens.com"',
];
for (const markup of requiredMarkup) {
  if (!indexHtml.includes(markup)) throw new Error(`Missing required PRD Holding Page markup: ${markup}`);
}

for (const forbiddenMarkup of [
  '<script',
  '<form',
  'javascript:',
  'href="#"',
  '/api/',
  'checkout',
  'glancelytics',
  'googleapis.com',
  'gstatic.com',
  '<picture',
  'srcset=',
  'background-image:',
  'hero-live-band',
]) {
  if (indexHtml.toLowerCase().includes(forbiddenMarkup)) {
    throw new Error(`Forbidden PRD Holding Page markup found: ${forbiddenMarkup}`);
  }
}

for (const tag of indexHtml.match(/<(?:img|link|source)\b[^>]*>/gi) ?? []) {
  for (const match of tag.matchAll(/\b(?:href|src)="([^"]+)"/gi)) checkLocalAsset(match[1]!);
  for (const match of tag.matchAll(/\bsrcset="([^"]+)"/gi)) {
    for (const candidate of match[1]!.split(',')) checkLocalAsset(candidate.trim().split(/\s+/)[0]!);
  }
}

for (const match of indexHtml.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)) {
  const href = match[1];
  if (!href || href === '#' || (!href.startsWith('https:') && !href.startsWith('mailto:'))) {
    throw new Error(`Invalid PRD Holding Page action: ${href || '(empty)'}`);
  }
}

const checkedStylesheets = new Set<string>();
for (;;) {
  const stylesheet = [...referencedFiles].find((file) => file.endsWith('.css') && !checkedStylesheets.has(file));
  if (!stylesheet) break;

  checkedStylesheets.add(stylesheet);
  const css = readFileSync(path.join(holdingRoot, stylesheet), 'utf8');
  const cssUrl = new URL(`/${stylesheet}`, canonicalUrl).toString();
  for (const match of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
    checkLocalAsset(new URL(match[1]!, cssUrl).toString());
  }
}

for (const file of files) {
  if (/\.(?:avif|gif|ico|jpe?g|png|svg|webp)$/i.test(file) && !allowedImageFiles.has(file)) {
    throw new Error(`Unexpected image in PRD Holding Page artifact: ${file}`);
  }
  if (!requiredFiles.has(file) && !referencedFiles.has(file)) {
    throw new Error(`Unexpected or unreferenced file in PRD Holding Page artifact: ${file}`);
  }
}

const headers = readFileSync(path.join(holdingRoot, '_headers'), 'utf8');
if (!headers.includes('/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-transform')) {
  throw new Error('Holding root headers must prevent indexing and Cloudflare mailto rewriting.');
}
if (!headers.includes('/_astro/*\n  Cache-Control: public, max-age=31536000, immutable')) {
  throw new Error('Holding _headers lacks immutable Astro asset caching.');
}

const workflowDirectory = path.join(repoRoot, '.github', 'workflows');
const holdingWorkflowName = 'prd-holding-page.yml';
for (const entry of readdirSync(workflowDirectory)) {
  const workflowPath = path.join(workflowDirectory, entry);
  if (!statSync(workflowPath).isFile() || !/\.ya?ml$/.test(entry)) continue;

  const source = readFileSync(workflowPath, 'utf8');
  if (entry !== holdingWorkflowName && /dist-holding|--branch=holding|prd-holding/.test(source)) {
    throw new Error(`Holding deployment behavior leaked into ${entry}.`);
  }
}

const holdingWorkflow = readFileSync(path.join(workflowDirectory, holdingWorkflowName), 'utf8');
for (const requiredWorkflowText of [
  'workflow_dispatch:',
  'default: false',
  'name: prd-holding',
  'path: apps/web/dist-holding',
  'pages deploy apps/web/dist-holding --project-name=blackbox-records-web --branch=holding',
]) {
  if (!holdingWorkflow.includes(requiredWorkflowText)) {
    throw new Error(`Holding workflow lacks required isolation text: ${requiredWorkflowText}`);
  }
}
if (/^\s*push:/m.test(holdingWorkflow)) throw new Error('PRD Holding Page workflow must not run on push.');

console.log('PRD Holding Page artifact and workflow isolation checks passed.');
