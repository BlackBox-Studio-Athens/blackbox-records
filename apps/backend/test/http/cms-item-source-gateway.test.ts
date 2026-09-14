import { expect, it, vi } from 'vitest';
import {
  createCmsItemSourceGateway,
  prepareCmsSetupPresentation,
} from '../../src/interfaces/http/routes/cms-item-source-gateway';

const selection = {
  mode: 'create' as const,
  sourceKind: 'release' as const,
  slug: 'new-record',
  data: { title: 'New record', featured: false, image: { id: 'media-one' } },
};
const source = {
  id: 'source-one',
  slug: selection.slug,
  data: { ...selection.data, featured: 0, image: { id: 'media-one', url: '/image.jpg' }, subtitle: null },
};
const reply = (item = source) => Response.json({ data: { item } });
const operator = new Request('https://ops.example/api/internal/items', {
  headers: { 'Cf-Access-Jwt-Assertion': 'verified-assertion', Cookie: 'private', Authorization: 'private' },
});

it('projects only CMS copy during draft setup and leaves private artwork for publication', async () => {
  await expect(
    prepareCmsSetupPresentation({
      ...source,
      data: {
        title: ' Record ',
        summary: 'CMS copy',
        image: { url: 'https://staff.example/private.jpg' },
        stripeProductId: 'untrusted',
        taxCode: 'untrusted',
      },
    }),
  ).resolves.toEqual({
    name: 'Record',
    description: 'CMS copy',
    imageUrls: [],
    metadata: {},
    taxCode: 'txcd_99999999',
  });
  await expect(
    prepareCmsSetupPresentation({ ...source, data: { title: 'Record', summary: null } }),
  ).resolves.toMatchObject({ description: '' });
  await expect(prepareCmsSetupPresentation({ ...source, data: { title: ' ' } })).rejects.toThrow('invalid');
  await expect(
    prepareCmsSetupPresentation({ ...source, data: { title: 'Record', summary: { text: 'Invalid' } } }),
  ).rejects.toThrow('invalid');
});

it('recovers a committed source after losing its creation response without another write', async () => {
  let saved = false;
  const requests: Request[] = [];
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const request = input as Request;
    requests.push(request);
    if (request.method === 'GET') return saved ? reply() : new Response(null, { status: 404 });
    expect(await request.json()).toEqual({ slug: selection.slug, data: selection.data });
    saved = true;
    throw new Error('Lost acknowledgement');
  });
  const gateway = createCmsItemSourceGateway({ fetch }, operator);
  await expect(gateway.ensureSource(selection)).rejects.toThrow('Lost acknowledgement');
  await expect(gateway.ensureSource(selection)).resolves.toEqual(source);
  expect(requests.map((request) => request.method)).toEqual(['GET', 'POST', 'GET']);
  for (const request of requests) {
    expect(request.url).toMatch(/^https:\/\/ops.example\/_emdash\/api\/content\/releases(?:\/new-record)?$/);
    expect(request.redirect).toBe('manual');
    expect(Object.fromEntries(request.headers)).toEqual({
      'cf-access-jwt-assertion': 'verified-assertion',
      'content-type': 'application/json',
      origin: 'https://ops.example',
      'x-emdash-request': '1',
    });
  }
});

it('selects an existing source by exact ID without rewriting its content', async () => {
  const fetch = vi.fn(async () => reply());
  const gateway = createCmsItemSourceGateway({ fetch }, operator);
  await expect(gateway.ensureSource({ mode: 'existing', sourceKind: 'distro', id: source.id })).resolves.toEqual(
    source,
  );
  await expect(gateway.ensureSource({ mode: 'existing', sourceKind: 'distro', id: 'wrong-id' })).rejects.toThrow(
    'unavailable',
  );
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('refuses mismatched content and uncertain reads without attempting creation', async () => {
  for (const response of [
    reply({ ...source, data: { ...source.data, title: 'Different record' } }),
    new Response('private error', { status: 403 }),
    new Response(null, { status: 302, headers: { Location: 'https://elsewhere.example' } }),
    Response.json({ data: {} }),
  ]) {
    const fetch = vi.fn(async () => response);
    await expect(createCmsItemSourceGateway({ fetch }, operator).ensureSource(selection)).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  }
});
