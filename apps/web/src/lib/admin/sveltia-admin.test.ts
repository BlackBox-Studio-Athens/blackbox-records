import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFrontmatter } from 'astro/markdown';
import { stringify } from 'yaml';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSveltiaConfig, createSveltiaConfigResponse } from './sveltia-config';
import { resolveSveltiaRuntimeConfig } from './sveltia-runtime-config';
import { assertSveltiaBuildArtifacts } from './sveltia-build-validation';
import { preserveArtistSlug, startAdmin } from './bootstrap';
import { registerPreviews } from './previews';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const indexHtml = read('../../../public/admin/index.html');
const bootstrapJs = read('./bootstrap.js');

afterEach(() => vi.unstubAllGlobals());

describe('Sveltia integration', () => {
  it('round-trips Artist and News Markdown through preSave into Astro-readable disposable files', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'blackbox-cms-roundtrip-'));
    try {
      for (const collection of ['artists', 'news']) {
        const sourceDirectory = new URL(`../../content/${collection}/`, import.meta.url);
        const filename = (await readdir(sourceDirectory)).find((name) => name.endsWith('.md'))!;
        const original = parseFrontmatter(await readFile(new URL(filename, sourceDirectory), 'utf8'));
        const body =
          original.content +
          '\n# Round-trip\n\nA **bold** and *emphasized* [link](https://blackbox-records-web.pages.dev/).\n\n- List item\n\n```js\nconst value = 1;\n```\n';
        const data = new Map(Object.entries({ ...original.frontmatter, body }));
        const saved = preserveArtistSlug({
          entry: new Map<string, unknown>([
            ['collection', collection],
            ['data', data],
          ]),
        });
        const { body: savedBody, ...frontmatter } = Object.fromEntries(saved);
        const fixturePath = join(directory, collection + '.md');
        await writeFile(fixturePath, `---\n${stringify(frontmatter)}---${savedBody}`);
        const restored = parseFrontmatter(await readFile(fixturePath, 'utf8'));
        expect(restored.content).toBe(body);
        expect(restored.frontmatter).toEqual(frontmatter);
        if (collection === 'artists') expect(restored.frontmatter.slug).toBe(original.frontmatter.slug);
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('defaults development to local and secret-free production to disabled', () => {
    expect(resolveSveltiaRuntimeConfig({ environment: {}, isDevelopment: true })).toEqual({ mode: 'local' });
    expect(resolveSveltiaRuntimeConfig({ environment: {}, isDevelopment: false })).toEqual({ mode: 'disabled' });
    expect(() =>
      resolveSveltiaRuntimeConfig({ environment: { SVELTIA_BACKEND_MODE: '' }, isDevelopment: false }),
    ).toThrow('SVELTIA_BACKEND_MODE');
  });

  it.each([
    '',
    '__AUTH_URL__',
    'https://example.com',
    'http://cms.workers.dev',
    'https://127.0.0.1',
    'https://[::1]',
    'https://user:secret@cms.workers.dev',
    'https://cms.workers.dev/callback',
    'https://cms.workers.dev?secret=hidden',
  ])('rejects unsafe authenticator settings without printing values: %s', (value) => {
    expect(() =>
      resolveSveltiaRuntimeConfig({
        environment: { SVELTIA_BACKEND_MODE: 'hosted', SVELTIA_AUTH_BASE_URL: value },
        isDevelopment: false,
      }),
    ).toThrow('SVELTIA_AUTH_BASE_URL');
    try {
      resolveSveltiaRuntimeConfig({
        environment: { SVELTIA_BACKEND_MODE: 'hosted', SVELTIA_AUTH_BASE_URL: value },
        isDevelopment: false,
      });
    } catch (error) {
      expect(String(error)).not.toContain('secret@');
    }
  });

  it.each(['local', 'hosted', 'disabled'] as const)(
    'validates the %s artifact and rejects a mismatched marker',
    async (mode) => {
      const runtimeConfig = resolveSveltiaRuntimeConfig({
        environment: { SVELTIA_BACKEND_MODE: mode, SVELTIA_AUTH_BASE_URL: 'https://blackbox-cms-auth.workers.dev' },
        isDevelopment: false,
      });
      const configYaml = await (
        mode === 'disabled'
          ? createSveltiaConfigResponse({ mode })
          : createSveltiaConfigResponse({
              mode,
              yaml: buildSveltiaConfig({
                runtimeConfig,
                logoUrl: 'https://blackbox-records-web.pages.dev/logo.svg',
                siteRootUrl: 'https://blackbox-records-web.pages.dev/',
              }),
            })
      ).text();
      expect(() =>
        assertSveltiaBuildArtifacts({ expectedMode: mode, configYaml, indexHtml, bootstrapJs }),
      ).not.toThrow();
      expect(() =>
        assertSveltiaBuildArtifacts({
          expectedMode: mode,
          configYaml: configYaml.replace('blackbox-sveltia-mode', 'missing-mode'),
          indexHtml,
          bootstrapJs,
        }),
      ).toThrow();
    },
  );

  it('keeps the native static document, pinned runtime, and no retired boot or media surface', () => {
    expect(indexHtml).toContain('src="./init.js"');
    expect(existsSync(new URL('../../pages/admin/index.astro', import.meta.url))).toBe(false);
    expect(
      existsSync(new URL('../../pages/admin/media', import.meta.url)) &&
        existsSync(new URL('../../pages/admin/media/[collection]/[asset].ts', import.meta.url)),
    ).toBe(false);
    expect(bootstrapJs + read('./previews.js')).not.toMatch(
      /MutationObserver|setTimeout|setInterval|decapbridge|admin\/media|singleton|__BLACKBOX/,
    );
  });

  it('preserves Artist identity and Markdown through the supported preSave data map', () => {
    const body = '# Heading\n\nA **bold** [link](https://blackbox-records-web.pages.dev/).\n\n- Item\n\n`code`';
    const data = new Map([
      ['title', 'Νέα Μπάντα'],
      ['body', body],
    ]);
    const entry = new Map<string, unknown>([
      ['collection', 'artists'],
      ['data', data],
    ]);
    const saved = preserveArtistSlug({ entry });
    expect(saved.get('slug')).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(saved.get('body')).toBe(body);
    data.set('slug', 'existing-identity');
    data.set('title', 'New title');
    expect(preserveArtistSlug({ entry }).get('slug')).toBe('existing-identity');
    entry.set('collection', 'news');
    expect(preserveArtistSlug({ entry })).toBe(data);
  });

  it('registers seven supported previews and uses getAsset for existing, new, and invalid media', () => {
    const templates = new Map<string, { render: (this: unknown) => unknown }>();
    const CMS = {
      registerPreviewStyle: vi.fn(),
      registerPreviewTemplate: (name: string, template: { render: (this: unknown) => unknown }) =>
        templates.set(name, template),
    };
    const h = (tag: string, props: unknown, ...children: unknown[]) => ({ tag, props, children });
    registerPreviews(CMS, (component: unknown) => component, h);
    expect([...templates.keys()]).toEqual([
      'home-site',
      'about-site',
      'services-site',
      'artists',
      'releases',
      'distro',
      'news',
    ]);
    expect(CMS.registerPreviewStyle).toHaveBeenCalledWith('./preview.css');
    for (const url of [
      'blob:existing-image',
      'blob:new-image',
      './relative-image.jpg',
      '/assets/root-image.jpg',
      'javascript:alert(1)',
      undefined,
    ]) {
      const data = { title: 'Image test', image: './art.jpg', image_alt: 'Artwork' };
      const getAsset = vi.fn(() => ({ url }));
      const entry = { get: () => data, getIn: (keys: string[]) => data[keys[1] as keyof typeof data] };
      const rendered = JSON.stringify(templates.get('distro')!.render.call({ props: { entry, getAsset } }));
      expect(getAsset).toHaveBeenCalledWith('./art.jpg');
      if (url && !url.startsWith('javascript:')) expect(rendered).toContain(url);
      else expect(rendered).toContain('unavailable');
      expect(rendered).not.toContain('javascript:');
    }
  });

  it.each(['disabled', 'local', 'hosted', 'invalid', 'download-error', 'config-error', 'init-error'])(
    'handles %s startup without retry machinery',
    async (mode) => {
      const copy = { textContent: '' };
      const status = { querySelector: () => copy, remove: vi.fn(), setAttribute: vi.fn() };
      const append = vi.fn((script: { onload: () => void; onerror: () => void }) =>
        mode === 'download-error' ? script.onerror() : script.onload(),
      );
      const CMS = {
        init: vi.fn(async () => {
          if (mode === 'init-error') throw new Error('init');
        }),
        registerPreviewStyle: vi.fn(),
        registerPreviewTemplate: vi.fn(),
        registerEventListener: vi.fn(),
      };
      vi.stubGlobal('window', { CMS, createClass: (value: unknown) => value, h: vi.fn() });
      vi.stubGlobal('document', { querySelector: () => status, createElement: () => ({}), head: { append } });
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
          ok: mode !== 'config-error',
          text: async () => `# blackbox-sveltia-mode: ${mode.endsWith('-error') ? 'local' : mode}`,
        })),
      );
      await startAdmin();
      if (mode === 'disabled') {
        expect(append).not.toHaveBeenCalled();
        expect(copy.textContent).toContain('unavailable');
      } else if (mode === 'local' || mode === 'hosted') {
        expect(CMS.init).toHaveBeenCalledOnce();
        expect(CMS.registerEventListener).toHaveBeenCalledWith({ name: 'preSave', handler: preserveArtistSlug });
        expect(status.remove).toHaveBeenCalledOnce();
      } else {
        expect(copy.textContent).toContain('reload');
        expect(status.remove).not.toHaveBeenCalled();
      }
    },
  );
});
