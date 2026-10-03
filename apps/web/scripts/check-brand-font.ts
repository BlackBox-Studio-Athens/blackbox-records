import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = fileURLToPath(new URL('..', import.meta.url));
// Outline-simplified derivative made by scripts/simplify-veneer.py; see that script for its source and settings.
const expectedVeneerSha256 = '92be7827d6c18ddf62ea4e84709f42700025c07059842e13158ea9bcfee50e2d';
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
  const uiCss = readFileSync(path.join(root, 'src', 'styles', 'fonts.css'), 'utf8').replaceAll('\r\n', '\n');
  const siteLayout = readFileSync(path.join(root, 'src', 'layouts', 'SiteLayout.astro'), 'utf8');
  const notFoundPage = readFileSync(path.join(root, 'src', 'pages', '404.astro'), 'utf8');

  for (const fontPath of [publicFont, bundledFont]) {
    if (sha256(fontPath) !== expectedVeneerSha256) throw new Error(`Veneer byte parity failed for ${fontPath}.`);
  }
  requireText(publicCss, 'font-display: swap', 'Stable Veneer CSS');
  requireText(globalCss, "url('../assets/fonts/brand/veneer_regular.woff2')", 'Bundled Veneer CSS');
  requireText(globalCss, 'font-display: swap', 'Bundled Veneer CSS');
  requireText(globalCss, "@import './fonts.css'", 'Main font stylesheet');
  requireText(siteLayout, '@/assets/fonts/brand/veneer_regular.woff2?url', 'Veneer URL import');
  requireText(siteLayout, 'href={veneerFontUrl} as="font" type="font/woff2" crossorigin="anonymous"', 'Veneer preload');
  requireText(notFoundPage, "import '@/styles/fonts.css'", '404 font stylesheet');
  for (const [family, weight] of [
    ['Inter', '400 600'],
    ['Geist Mono', '400 500'],
    ['Bebas Neue', '400'],
  ]) {
    if (
      !uiCss.includes(
        `font-family: '${family}';\n  font-style: normal;\n  font-weight: ${weight};\n  font-display: swap;`,
      )
    ) {
      throw new Error(`Self-hosted ${family} must declare weights ${weight} with swap display.`);
    }
  }
  for (const [, asset] of uiCss.matchAll(/url\('\.\.\/assets\/fonts\/ui\/([^']+)'\)/g)) {
    const font = readFileSync(path.join(root, 'src', 'assets', 'fonts', 'ui', asset!));
    if (font.subarray(0, 4).toString() !== 'wOF2') throw new Error(`Invalid UI WOFF2: ${asset}.`);
  }
  for (const source of [siteLayout, notFoundPage, globalCss, uiCss]) {
    if (/fonts\.(?:googleapis|gstatic)\.com/.test(source)) throw new Error('Public fonts must be self-hosted.');
  }
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
  requireText(generatedCss, 'font-display:swap', 'Generated main-site CSS');

  const uiFonts = ['inter-latin', 'geist-mono-latin', 'bebas-neue-latin'].map((name) => {
    const assets = listFiles(astroRoot).filter(
      (file) => path.basename(file).startsWith(`${name}.`) && file.endsWith('.woff2'),
    );
    if (assets.length !== 1) throw new Error(`Expected one fingerprinted ${name} asset, found ${assets.length}.`);
    requireText(generatedCss, path.basename(assets[0]!), 'Generated UI font CSS');
    return path.basename(assets[0]!);
  });

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
  for (const file of normalRouteHtml) {
    const html = readFileSync(file, 'utf8');
    if (/fonts\.(?:googleapis|gstatic)\.com/.test(html)) throw new Error(`Third-party font request in ${file}.`);
    if (html.includes('view-transition-name') || html.includes('data-astro-transition-scope')) {
      throw new Error(`Unused view-transition output in ${file}.`);
    }
    // Redirect-only documents have no font CSS. Only Releases preloads Geist for its first-screen catalog eyebrow.
    const isNotFound = path.basename(file) === '404.html';
    if (!html.includes('<body') || (!isNotFound && !html.includes('data-app-shell-main'))) continue;
    const expected = isNotFound ? [uiFonts[0]!, uiFonts[2]!] : [path.basename(generatedFonts[0]!), uiFonts[0]!];
    if (path.relative(distRoot, file).split(path.sep).join('/') === 'releases/index.html') expected.push(uiFonts[1]!);
    const links = html.match(/<link\b[^>]*>/g) ?? [];
    for (const font of expected) {
      if (
        !links.some(
          (link) =>
            link.includes(font) &&
            link.includes('rel="preload"') &&
            link.includes('as="font"') &&
            link.includes('type="font/woff2"') &&
            /\bcrossorigin(?:[\s=>])/.test(link),
        )
      ) {
        throw new Error(`Missing CORS font preload matching bundled CSS for ${font} in ${file}.`);
      }
    }
  }
}

function main(): void {
  checkBrandFontSources();
  checkBrandFontBuild();
  console.log(`Veneer delivery validation passed (${expectedVeneerSha256}, 78616 bytes).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
