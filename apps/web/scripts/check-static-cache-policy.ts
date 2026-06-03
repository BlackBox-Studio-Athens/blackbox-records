import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const fingerprintedAstroAssetPath = '/_astro/*';
export const immutableAstroCacheControl = 'public, max-age=31536000, immutable';
export const maxCloudflarePagesHeaderLineLength = 2000;
export const maxCloudflarePagesHeaderRules = 100;

export interface StaticHeadersRule {
  headers: string[];
  path: string;
}

function parseHeaderLine(headerLine: string): { name: string; value: string } | null {
  const separatorIndex = headerLine.indexOf(':');

  if (separatorIndex === -1) {
    return null;
  }

  return {
    name: headerLine.slice(0, separatorIndex).trim().toLowerCase(),
    value: headerLine.slice(separatorIndex + 1).trim(),
  };
}

export function parseHeadersArtifact(content: string): StaticHeadersRule[] {
  const rules: StaticHeadersRule[] = [];
  let currentRule: StaticHeadersRule | null = null;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    if (/^\S/.test(line)) {
      currentRule = {
        headers: [],
        path: trimmedLine,
      };
      rules.push(currentRule);
      continue;
    }

    if (!currentRule) {
      throw new Error('Static cache policy artifact is malformed: header line appears before any path rule.');
    }

    currentRule.headers.push(trimmedLine);
  }

  return rules;
}

export function validateStaticCachePolicyRules(rules: StaticHeadersRule[]): string[] {
  const issues: string[] = [];
  const fingerprintedRule = rules.find((rule) => rule.path === fingerprintedAstroAssetPath);

  if (rules.length > maxCloudflarePagesHeaderRules) {
    issues.push(
      `Built _headers artifact has ${rules.length} rules, which exceeds Cloudflare Pages Free-tier limit of ${maxCloudflarePagesHeaderRules}.`,
    );
  }

  for (const rule of rules) {
    for (const headerLine of rule.headers) {
      if (headerLine.length > maxCloudflarePagesHeaderLineLength) {
        issues.push(
          `Header line for ${rule.path} exceeds Cloudflare Pages Free-tier line limit of ${maxCloudflarePagesHeaderLineLength} characters.`,
        );
      }
    }

    const cacheControlHeader = rule.headers.map(parseHeaderLine).find((header) => header?.name === 'cache-control');

    if (!cacheControlHeader) {
      continue;
    }

    const normalizedValue = cacheControlHeader.value.toLowerCase();
    const hasLongLivedImmutableCaching =
      normalizedValue.includes('immutable') || normalizedValue.includes('max-age=31536000');

    if (rule.path !== fingerprintedAstroAssetPath && hasLongLivedImmutableCaching) {
      issues.push(`Immutable caching is not allowed for ${rule.path}.`);
    }

    if (rule.path === fingerprintedAstroAssetPath && normalizedValue !== immutableAstroCacheControl) {
      issues.push(
        `Expected ${fingerprintedAstroAssetPath} to use "${immutableAstroCacheControl}", but found "${cacheControlHeader.value}".`,
      );
    }
  }

  if (!fingerprintedRule) {
    issues.push(`Missing ${fingerprintedAstroAssetPath} cache rule in built _headers artifact.`);
  }

  return issues;
}

export function validateStaticCachePolicyArtifact(content: string): string[] {
  return validateStaticCachePolicyRules(parseHeadersArtifact(content));
}

export function checkStaticCachePolicyArtifact(content: string): void {
  const issues = validateStaticCachePolicyArtifact(content);

  if (issues.length > 0) {
    throw new Error(`Static cache policy validation failed:\n- ${issues.join('\n- ')}`);
  }
}

export function checkStaticCachePolicyFile(
  filePath = fileURLToPath(new URL('../dist/_headers', import.meta.url)),
): void {
  if (!existsSync(filePath)) {
    throw new Error(`Built _headers artifact not found at ${filePath}. Run pnpm build first.`);
  }

  checkStaticCachePolicyArtifact(readFileSync(filePath, 'utf8'));
}

function main(): void {
  checkStaticCachePolicyFile();
  console.log('Static cache policy validation passed.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
