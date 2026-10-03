import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { publicImageRequestWidths } from '../../src/cms/public-image-transform';

const webSource = fileURLToPath(new URL('../../../web/src/', import.meta.url));
const astroFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? astroFiles(join(directory, entry.name))
      : entry.name.endsWith('.astro')
        ? [join(directory, entry.name)]
        : [],
  );

it('accepts every srcset width the hosted image components emit', () => {
  const emitted = new Map<number, string>();
  for (const file of astroFiles(webSource)) {
    // ponytail: numeric array literals on lines that name widths; use an Astro parser if widths become computed.
    for (const line of readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => /widths/i.test(line)))
      for (const [, list] of line.matchAll(/\[([0-9,\s]+)\]/g))
        for (const width of list!.split(',').map(Number)) emitted.set(width, file.slice(webSource.length));
  }
  expect(emitted.size).toBeGreaterThan(10);
  for (const [width, file] of emitted) expect(publicImageRequestWidths.has(width), `${width} in ${file}`).toBe(true);
});
