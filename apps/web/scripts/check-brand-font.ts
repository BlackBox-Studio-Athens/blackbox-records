import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = fileURLToPath(new URL('..', import.meta.url));
const expectedVeneerSha256 = 'f02b74cb53a1640c6cbfc9a2aa5f5ce0609fa358231a9b30b93c1e0072622939';
const stableFontPath = '/assets/fonts/brand/veneer_regular.woff2';

function sha256(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function requireText(source: string, expected: string, label: string): void {
  if (!source.includes(expected)) throw new Error(`${label} must contain ${expected}.`);
}

export function checkBrandFontSources(root = webRoot): void {
  const publicFont = path.join(root, 'public', stableFontPath);
  const bundledFont = path.join(root, 'src', 'assets', 'fonts', 'brand', 'veneer_regular.woff2');
  const publicCss = readFileSync(path.join(root, 'public', 'assets', 'fonts', 'brand', 'veneer.css'), 'utf8');
  const globalCss = readFileSync(path.join(root, 'src', 'styles', 'global.css'), 'utf8');
  const siteLayout = readFileSync(path.join(root, 'src', 'layouts', 'SiteLayout.astro'), 'utf8');

  for (const fontPath of [publicFont, bundledFont]) {
    if (sha256(fontPath) !== expectedVeneerSha256) throw new Error(`Veneer byte parity failed for ${fontPath}.`);
  }
  requireText(publicCss, 'font-display: optional', 'Stable Veneer CSS');
  requireText(globalCss, "url('../assets/fonts/brand/veneer_regular.woff2')", 'Bundled Veneer CSS');
  requireText(globalCss, 'font-display: optional', 'Bundled Veneer CSS');
  if (siteLayout.includes('/assets/fonts/brand/veneer.css')) {
    throw new Error('The main SiteLayout must not request the stable Holding Page Veneer stylesheet.');
  }
}

export function checkBrandFontBuild(root = webRoot): void {
  const distRoot = path.join(root, 'dist');
  const astroRoot = path.join(distRoot, '_astro');
  if (!existsSync(astroRoot)) throw new Error('Built Astro assets are missing. Run pnpm build first.');

  const generatedFonts = listFiles(astroRoot).filter((file) => /^veneer_regular\..+\.woff2$/.test(path.basename(file)));
  if (generatedFonts.length !== 1) {
    throw new Error(`Expected one fingerprinted Veneer build asset, found ${generatedFonts.length}.`);
  }
  if (sha256(generatedFonts[0]!) !== expectedVeneerSha256) {
    throw new Error('Fingerprinting changed the existing Veneer font bytes.');
  }

  const generatedCss = listFiles(astroRoot)
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');
  requireText(generatedCss, path.basename(generatedFonts[0]!), 'Generated main-site CSS');
  requireText(generatedCss, 'font-display:optional', 'Generated main-site CSS');

  const normalRouteHtml = listFiles(distRoot).filter(
    (file) =>
      file.endsWith('.html') &&
      !file.includes(`${path.sep}prd-holding${path.sep}`) &&
      !file.includes(`${path.sep}demo${path.sep}`),
  );
  const stableFontReferences = normalRouteHtml.filter((file) =>
    readFileSync(file, 'utf8').includes('/assets/fonts/brand/veneer.css'),
  );
  if (stableFontReferences.length > 0) {
    throw new Error(`Normal routes request the stable Holding Page font CSS: ${stableFontReferences.join(', ')}`);
  }
}

function main(): void {
  checkBrandFontSources();
  checkBrandFontBuild();
  console.log(`Veneer delivery validation passed (${expectedVeneerSha256}, 312816 bytes).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
