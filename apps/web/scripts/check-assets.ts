import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp, { type Metadata } from 'sharp';

export type AssetRuleId =
  | 'artist-portrait-ratio'
  | 'favicon-alpha'
  | 'favicon-size'
  | 'missing-image'
  | 'unreadable-image';

export type AssetDiagnosticSeverity = 'error' | 'warning';

export interface ImageAsset {
  path: string;
  sourcePath?: string | undefined;
  collection?: string | undefined;
  fieldPath?: string | undefined;
}

export interface AssetDiagnostic {
  severity: AssetDiagnosticSeverity;
  ruleId: AssetRuleId;
  assetPath: string;
  message: string;
  sourcePath?: string | undefined;
  expected?: string | undefined;
  actual?: string | undefined;
}

export interface AssetSkip {
  sourcePath: string;
  fieldPath: string;
  reason: string;
}

export interface AssetCheckResult {
  inspectedCount: number;
  diagnostics: AssetDiagnostic[];
  skipped: AssetSkip[];
}

const webRoot = fileURLToPath(new URL('../', import.meta.url));
const imageExtensions = new Set(['.gif', '.ico', '.jpg', '.jpeg', '.png', '.svg', '.webp']);
const contentEntryExtensions = new Set(['.json', '.md', '.mdx']);
const contentImageKeys = new Set(['cover_image', 'image']);
const expectedFaviconIcoSizes = new Set(['16x16', '32x32', '48x48']);
const artistPortraitRatio = 3 / 4;
const artistPortraitRatioTolerance = 0.025;

type AssetMetadata = Pick<Metadata, 'format'> & Partial<Pick<Metadata, 'channels' | 'hasAlpha' | 'height' | 'width'>>;

function normalizePath(path: string): string {
  return path.split(sep).join('/');
}

function extensionFor(path: string): string {
  const match = /\.[^.]+$/.exec(path);
  return match ? match[0].toLowerCase() : '';
}

function toRepoPath(path: string, root = webRoot): string {
  return normalizePath(relative(root, path));
}

function listFiles(directory: string): string[] {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = resolve(directory, entry);
      const stats = statSync(path);

      if (stats.isDirectory()) return listFiles(path);
      return stats.isFile() ? [path] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function createDiagnostic(input: {
  severity: AssetDiagnosticSeverity;
  ruleId: AssetRuleId;
  assetPath: string;
  message: string;
  sourcePath?: string | undefined;
  expected?: string | undefined;
  actual?: string | undefined;
}): AssetDiagnostic {
  const diagnostic: AssetDiagnostic = {
    severity: input.severity,
    ruleId: input.ruleId,
    assetPath: input.assetPath,
    message: input.message,
  };

  if (input.sourcePath) diagnostic.sourcePath = input.sourcePath;
  if (input.expected) diagnostic.expected = input.expected;
  if (input.actual) diagnostic.actual = input.actual;

  return diagnostic;
}

export function formatDiagnostic(diagnostic: AssetDiagnostic): string {
  const source = diagnostic.sourcePath ? ` source=${diagnostic.sourcePath}` : '';
  const expected = diagnostic.expected ? ` expected=${diagnostic.expected}` : '';
  const actual = diagnostic.actual ? ` actual=${diagnostic.actual}` : '';

  return `[${diagnostic.severity}] ${diagnostic.ruleId} ${diagnostic.assetPath}${source} - ${diagnostic.message}${expected}${actual}`;
}

function formatRatio(width: number, height: number): string {
  return `${width}x${height} (${(width / height).toFixed(3)})`;
}

export function evaluateImageMetadata(asset: ImageAsset, metadata: AssetMetadata): AssetDiagnostic[] {
  const assetPath = normalizePath(asset.path);
  const diagnostics: AssetDiagnostic[] = [];
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    diagnostics.push(
      createDiagnostic({
        severity: 'error',
        ruleId: 'unreadable-image',
        assetPath,
        sourcePath: asset.sourcePath,
        message: 'Sharp could not read stable image dimensions.',
      }),
    );
    return diagnostics;
  }

  const fileName = basename(assetPath);

  if (fileName === 'favicon-96x96.png') {
    if (metadata.format !== 'png' || width !== 96 || height !== 96) {
      diagnostics.push(
        createDiagnostic({
          severity: 'error',
          ruleId: 'favicon-size',
          assetPath,
          message: 'PNG favicon must remain the browser-declared 96px square asset.',
          expected: 'png 96x96',
          actual: `${metadata.format ?? 'unknown'} ${width}x${height}`,
        }),
      );
    }

    if (!metadata.hasAlpha && (metadata.channels ?? 0) < 4) {
      diagnostics.push(
        createDiagnostic({
          severity: 'error',
          ruleId: 'favicon-alpha',
          assetPath,
          message: 'PNG favicon must keep an alpha channel for transparent browser chrome rendering.',
          expected: 'alpha channel',
          actual: `channels=${metadata.channels ?? 'unknown'} hasAlpha=${String(metadata.hasAlpha)}`,
        }),
      );
    }
  }

  if (fileName === 'favicon.svg' && width !== height) {
    diagnostics.push(
      createDiagnostic({
        severity: 'error',
        ruleId: 'favicon-size',
        assetPath,
        message: 'SVG favicon viewbox must stay square.',
        expected: 'square viewbox',
        actual: `${width}x${height}`,
      }),
    );
  }

  if (asset.collection === 'artists' && asset.fieldPath === 'image') {
    const ratio = width / height;

    if (Math.abs(ratio - artistPortraitRatio) > artistPortraitRatioTolerance || width < 1200 || height < 1600) {
      diagnostics.push(
        createDiagnostic({
          severity: 'warning',
          ruleId: 'artist-portrait-ratio',
          assetPath,
          sourcePath: asset.sourcePath,
          message: 'Artist roster images should be portrait-oriented sources for the documented 3:4 crop.',
          expected: 'at least 1200x1600 and 3:4 ratio',
          actual: formatRatio(width, height),
        }),
      );
    }
  }

  return diagnostics;
}

function evaluateFaviconIco(asset: ImageAsset): AssetDiagnostic[] {
  const assetPath = normalizePath(asset.path);
  const buffer = readFileSync(asset.path);
  const diagnostics: AssetDiagnostic[] = [];

  if (buffer.length < 6 || buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
    return [
      createDiagnostic({
        severity: 'error',
        ruleId: 'unreadable-image',
        assetPath,
        message: 'Favicon ICO header is not a valid icon directory.',
      }),
    ];
  }

  const imageCount = buffer.readUInt16LE(4);
  const sizes = new Set<string>();
  let hasLowBitDepth = false;

  for (let index = 0; index < imageCount; index += 1) {
    const offset = 6 + index * 16;
    if (buffer.length < offset + 16) {
      diagnostics.push(
        createDiagnostic({
          severity: 'error',
          ruleId: 'unreadable-image',
          assetPath,
          message: 'Favicon ICO directory entry is truncated.',
        }),
      );
      break;
    }

    const widthByte = buffer.at(offset) ?? 0;
    const heightByte = buffer.at(offset + 1) ?? 0;
    const width = widthByte === 0 ? 256 : widthByte;
    const height = heightByte === 0 ? 256 : heightByte;
    const bitCount = buffer.readUInt16LE(offset + 6);

    sizes.add(`${width}x${height}`);
    if (bitCount < 32) hasLowBitDepth = true;
  }

  const missingSizes = [...expectedFaviconIcoSizes].filter((size) => !sizes.has(size));

  if (missingSizes.length > 0) {
    diagnostics.push(
      createDiagnostic({
        severity: 'error',
        ruleId: 'favicon-size',
        assetPath,
        message: 'Favicon ICO must keep the committed multi-size browser icon entries.',
        expected: [...expectedFaviconIcoSizes].join(','),
        actual: [...sizes].sort().join(',') || 'none',
      }),
    );
  }

  if (hasLowBitDepth) {
    diagnostics.push(
      createDiagnostic({
        severity: 'error',
        ruleId: 'favicon-alpha',
        assetPath,
        message: 'Favicon ICO entries must remain 32-bit for transparent icon rendering.',
        expected: '32-bit entries',
        actual: 'one or more entries below 32-bit',
      }),
    );
  }

  return diagnostics;
}

export async function inspectImageAsset(asset: ImageAsset): Promise<AssetDiagnostic[]> {
  if (basename(asset.path) === 'favicon.ico') return evaluateFaviconIco(asset);

  try {
    const metadata = await sharp(asset.path).metadata();
    return evaluateImageMetadata(asset, metadata);
  } catch (error) {
    return [
      createDiagnostic({
        severity: 'error',
        ruleId: 'unreadable-image',
        assetPath: normalizePath(asset.path),
        sourcePath: asset.sourcePath,
        message: error instanceof Error ? error.message : 'Sharp could not read this image.',
      }),
    ];
  }
}

function isExternalReference(value: string): boolean {
  return /^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('data:');
}

function stripScalarQuotes(value: string): string {
  const trimmed = value.trim();
  const quoted = /^['"](?<value>.*)['"]$/.exec(trimmed);
  return quoted?.groups?.value ?? trimmed;
}

function readFrontmatter(source: string): string | null {
  const match = /^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---/.exec(source);
  return match?.groups?.frontmatter ?? null;
}

function collectMarkdownReferences(source: string): Array<{ fieldPath: string; value: string }> {
  const frontmatter = readFrontmatter(source);
  if (!frontmatter) return [];

  return frontmatter
    .split(/\r?\n/)
    .flatMap((line) => {
      const match = /^(?<key>cover_image|image):\s*(?<value>.+?)\s*$/.exec(line);
      if (!match?.groups) return [];

      return [
        {
          fieldPath: match.groups.key ?? '',
          value: stripScalarQuotes(match.groups.value ?? ''),
        },
      ];
    })
    .filter((reference) => reference.value.length > 0);
}

function collectJsonReferences(value: unknown, path: string[] = []): Array<{ fieldPath: string; value: string }> {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectJsonReferences(entry, [...path, String(index)]));
  }

  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, entryValue]) => {
    const nextPath = [...path, key];
    const fieldPath = nextPath.join('.');

    if (contentImageKeys.has(key) && typeof entryValue === 'string') {
      return [
        {
          fieldPath,
          value: entryValue,
        },
      ];
    }

    return collectJsonReferences(entryValue, nextPath);
  });
}

function collectionNameFor(entryPath: string, root = webRoot): string | undefined {
  const relativePath = normalizePath(relative(resolve(root, 'src/content'), entryPath));
  const [collection] = relativePath.split('/');
  return collection || undefined;
}

function resolveContentImage(entryPath: string, reference: string, root = webRoot): string {
  if (reference.startsWith('/')) return resolve(root, 'public', reference.slice(1));
  return resolve(dirname(entryPath), reference);
}

function discoverContentAssets(root = webRoot): { assets: ImageAsset[]; skipped: AssetSkip[] } {
  const contentRoot = resolve(root, 'src/content');
  const entries = listFiles(contentRoot).filter((path) => contentEntryExtensions.has(extensionFor(path)));
  const assets: ImageAsset[] = [];
  const skipped: AssetSkip[] = [];

  for (const entryPath of entries) {
    const extension = extensionFor(entryPath);
    const source = readFileSync(entryPath, 'utf8');
    const references =
      extension === '.json' ? collectJsonReferences(JSON.parse(source)) : collectMarkdownReferences(source);
    const sourcePath = toRepoPath(entryPath, root);
    const collection = collectionNameFor(entryPath, root);

    for (const reference of references) {
      if (isExternalReference(reference.value)) {
        skipped.push({
          sourcePath,
          fieldPath: reference.fieldPath,
          reason: 'external image reference',
        });
        continue;
      }

      const assetPath = resolveContentImage(entryPath, reference.value, root);

      if (!existsSync(assetPath)) {
        assets.push({
          path: assetPath,
          sourcePath,
          collection,
          fieldPath: reference.fieldPath,
        });
        continue;
      }

      if (!imageExtensions.has(extensionFor(assetPath))) {
        skipped.push({
          sourcePath,
          fieldPath: reference.fieldPath,
          reason: `unsupported image extension ${extensionFor(assetPath) || '(none)'}`,
        });
        continue;
      }

      assets.push({
        path: assetPath,
        sourcePath,
        collection,
        fieldPath: reference.fieldPath,
      });
    }
  }

  return { assets, skipped };
}

function discoverPublicAssets(root = webRoot): ImageAsset[] {
  const publicRoot = resolve(root, 'public');

  return listFiles(publicRoot)
    .filter((path) => imageExtensions.has(extensionFor(path)))
    .map((path) => ({ path }));
}

export async function runAssetCheck(root = webRoot): Promise<AssetCheckResult> {
  const publicAssets = discoverPublicAssets(root);
  const { assets: contentAssets, skipped } = discoverContentAssets(root);
  const assets = [...publicAssets, ...contentAssets].sort((left, right) =>
    normalizePath(left.path).localeCompare(normalizePath(right.path)),
  );
  const diagnostics: AssetDiagnostic[] = [];

  for (const asset of assets) {
    const assetPath = toRepoPath(asset.path, root);

    if (!existsSync(asset.path)) {
      diagnostics.push(
        createDiagnostic({
          severity: 'error',
          ruleId: 'missing-image',
          assetPath,
          sourcePath: asset.sourcePath,
          message: 'Content image reference does not resolve to a committed local file.',
        }),
      );
      continue;
    }

    const inspectedDiagnostics = await inspectImageAsset({
      ...asset,
      path: assetPath,
    });

    diagnostics.push(...inspectedDiagnostics);
  }

  return {
    inspectedCount: assets.length,
    diagnostics: diagnostics.sort((left, right) => formatDiagnostic(left).localeCompare(formatDiagnostic(right))),
    skipped: skipped.sort((left, right) =>
      `${left.sourcePath}:${left.fieldPath}`.localeCompare(`${right.sourcePath}:${right.fieldPath}`),
    ),
  };
}

function printResult(result: AssetCheckResult): void {
  const errors = result.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  const warnings = result.diagnostics.filter((diagnostic) => diagnostic.severity === 'warning');

  console.log(`Asset QA inspected ${result.inspectedCount} image references and static assets.`);

  for (const diagnostic of result.diagnostics) {
    console.log(formatDiagnostic(diagnostic));
  }

  if (result.skipped.length > 0) {
    for (const skipped of result.skipped) {
      console.log(`[skipped] ${skipped.sourcePath} field=${skipped.fieldPath} - ${skipped.reason}`);
    }
  } else {
    console.log('Skipped: none');
  }

  if (errors.length > 0) {
    console.log(`Asset QA failed with ${errors.length} error(s) and ${warnings.length} warning(s).`);
    process.exitCode = 1;
    return;
  }

  console.log(`Asset QA passed with ${warnings.length} warning(s).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAssetCheck()
    .then(printResult)
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
