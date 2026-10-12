import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const distRoot = fileURLToPath(new URL('../dist', import.meta.url));

function attribute(tag: string, name: string) {
  return new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag)?.[1] ?? null;
}

/** Every sitemap URL must be a built page that is indexable and canonical to itself. */
export function checkSitemapOutput(root: string): string[] {
  const sitemapPath = join(root, 'sitemap.xml');
  if (!existsSync(sitemapPath)) return [`sitemap.xml not found in ${root}.`];
  const locs = [...readFileSync(sitemapPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].flatMap(
    (match) => match[1] ?? [],
  );
  if (locs.length === 0) return ['sitemap.xml lists no URLs.'];
  // Home is the shortest URL; every other entry sits below it, including the base path.
  const home = locs.reduce((shortest, loc) => (loc.length < shortest.length ? loc : shortest));
  const issues: string[] = [];
  for (const loc of new Set(locs)) {
    if (!loc.startsWith(home) || !loc.endsWith('/')) {
      issues.push(`${loc} is not a page below ${home}.`);
      continue;
    }
    const file = join(root, loc.slice(home.length), 'index.html');
    if (!existsSync(file)) {
      issues.push(`${loc} has no built page.`);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const tags = html.match(/<(?:meta|link)\b[^>]*>/gi) ?? [];
    const robots = tags.find((tag) => /^<meta\b/i.test(tag) && attribute(tag, 'name')?.toLowerCase() === 'robots');
    if (robots && /noindex/i.test(attribute(robots, 'content') ?? '')) issues.push(`${loc} is marked noindex.`);
    const canonical = tags.find((tag) => /^<link\b/i.test(tag) && attribute(tag, 'rel')?.toLowerCase() === 'canonical');
    const href = canonical ? attribute(canonical, 'href') : null;
    if (href !== loc) issues.push(`${loc} is canonical to ${href ?? 'nothing'}.`);
  }
  return issues;
}

function run() {
  const issues = checkSitemapOutput(resolve(process.argv[2] ?? distRoot));
  if (issues.length > 0) {
    console.error(`Sitemap output validation failed:\n- ${issues.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }
  console.log('Sitemap output validation passed.');
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  run();
}
