import { BandcampPage, BandcampRecording } from '@blackbox/content-model';
import { z } from 'zod';
import { cmsStringProblemResponse } from '../platform/interfaces/http/responses';
import { createWorkerLogger, normalizeUnknownError } from '../platform/observability';
import { readBoundedText } from './preview-content';

export const bandcampResolutionPath = '/_emdash/api/blackbox/bandcamp/resolve';
const commandSchema = z.object({ url: z.string().max(2048) }).strict();
const tralbumSchema = z.object({
  id: z.number().int().positive().safe(),
  item_type: z.enum(['album', 'track']),
  current: z.object({ id: z.number().int().positive().safe(), type: z.enum(['album', 'track']) }),
});

// Bandcamp's public search answers hosted Workers, whose album/track page fetches get a Client Challenge.
const bandcampSearchUrl = 'https://bandcamp.com/api/bcsearch_public_api/1/autocomplete_elastic';
const searchSchema = z.object({
  auto: z.object({
    results: z
      .array(
        z.object({ type: z.string(), id: z.number().int().positive().safe(), item_url_path: z.string().optional() }),
      )
      .max(200),
  }),
});

/** What a lookup established: a player, a page Bandcamp does not have, or no answer because of its browser check. */
export type BandcampResolution =
  | { status: 'resolved'; recording: BandcampRecording }
  | { status: 'not_found'; suggestion?: BandcampPage }
  | { status: 'provider_blocked' };

class BandcampChallengeError extends Error {}
class BandcampNotFoundError extends Error {}

function decodeAttribute(value: string) {
  const named: Record<string, string> = { quot: '"', amp: '&', apos: "'", lt: '<', gt: '>' };
  return value.replace(/&(#x[\da-f]+|#\d+|quot|amp|apos|lt|gt);/gi, (entity, name: string) => {
    if (!name.startsWith('#')) return named[name.toLowerCase()] ?? entity;
    const code = name[1]?.toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1));
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : entity;
  });
}

async function recordingFromHtml(html: string, page: BandcampPage): Promise<BandcampRecording> {
  const recordings: BandcampRecording[] = [];
  let title = '';
  const add = (recording: BandcampRecording | null) => {
    if (recording) recordings.push(recording);
  };
  await new HTMLRewriter()
    .on('title', {
      text(chunk) {
        title += chunk.text;
      },
    })
    .on('meta[property="og:video"], meta[property="og:video:secure_url"]', {
      element(element) {
        add(BandcampRecording.fromEmbed(decodeAttribute(element.getAttribute('content') ?? '')));
      },
    })
    .on('[data-tralbum]', {
      element(element) {
        try {
          const result = tralbumSchema.safeParse(
            JSON.parse(decodeAttribute(element.getAttribute('data-tralbum') ?? '')),
          );
          if (!result.success) return;
          const data = result.data;
          add(BandcampRecording.parse({ kind: data.item_type, id: String(data.id) }));
          add(BandcampRecording.parse({ kind: data.current.type, id: String(data.current.id) }));
        } catch {
          /* Malformed metadata cannot establish a recording identity. */
        }
      },
    })
    .transform(new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))
    .body?.pipeTo(new WritableStream());
  const recording = recordings[0];
  if (!recording && title.trim() === 'Client Challenge') throw new BandcampChallengeError();
  if (
    !recording ||
    recording.kind !== page.kind ||
    recordings.some((other) => other.kind !== recording.kind || other.id !== recording.id)
  )
    throw new Error('Bandcamp did not provide a consistent player identity. Retry.');
  return recording;
}

async function searchBandcamp(text: string, kind: BandcampPage['kind'], fetchPage: typeof fetch, signal: AbortSignal) {
  try {
    const response = await fetchPage(bandcampSearchUrl, {
      method: 'POST',
      redirect: 'manual',
      signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        search_text: text,
        search_filter: kind === 'album' ? 'a' : 't',
        full_page: false,
        fan_id: null,
      }),
    });
    if (
      !response.ok ||
      response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
    ) {
      await response.body?.cancel();
      return [];
    }
    const results = searchSchema.parse(JSON.parse(await readBoundedText(response.body, 512 * 1024))).auto.results;
    return results.flatMap((result) => {
      const found = BandcampPage.parse(result.item_url_path ?? '');
      const recording = BandcampRecording.parse({
        kind: result.type === 'a' ? 'album' : 'track',
        id: String(result.id),
      });
      return found && recording && ['a', 't'].includes(result.type) && found.kind === kind
        ? [{ page: found, recording }]
        : [];
    });
  } catch (error) {
    if (signal.aborted) throw error;
    // Search only adds evidence; the page fetch still decides when search is unavailable.
    return [];
  }
}

export async function resolveBandcampPage(
  page: BandcampPage,
  fetchPage: typeof fetch = fetch,
): Promise<BandcampResolution> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('Bandcamp lookup timed out. Retry.'));
    }, 10_000);
  });
  const [, subdomain = '', slug = ''] =
    /^https:\/\/([^.]+)\.bandcamp\.com\/(?:album|track)\/(.+)$/.exec(page.url) ?? [];
  const words = slug.replaceAll('-', ' ');
  const search = (text: string) => searchBandcamp(text, page.kind, fetchPage, controller.signal);
  const lookup = async (): Promise<BandcampResolution> => {
    // Only the exact page address identifies the same recording.
    const exact = (await search(`${subdomain} ${words}`)).find((result) => result.page.url === page.url);
    if (exact) return { status: 'resolved', recording: exact.recording };
    let outcome: BandcampResolution;
    try {
      outcome = { status: 'resolved', recording: await readPage() };
    } catch (error) {
      if (error instanceof BandcampNotFoundError) outcome = { status: 'not_found' };
      else if (error instanceof BandcampChallengeError) outcome = { status: 'provider_blocked' };
      else throw error;
    }
    if (outcome.status === 'resolved') return outcome;
    // Suggest the same address on a related subdomain (thebruce, jointhebruce) only when exactly one exists.
    const related = (await search(words)).filter(({ page: other }) => {
      const host = new URL(other.url).hostname.split('.')[0]!;
      return (
        other.url.endsWith(`/${page.kind}/${slug}`) &&
        host !== subdomain &&
        (host.includes(subdomain) || subdomain.includes(host))
      );
    });
    return related.length === 1 ? { status: 'not_found', suggestion: related[0]!.page } : outcome;
  };
  const readPage = async () => {
    let current = page;
    const visited = new Set<string>();
    for (let redirects = 0; redirects <= 3; redirects++) {
      if (visited.has(current.url)) throw new Error('Bandcamp redirected in a loop.');
      visited.add(current.url);
      const response = await fetchPage(current.url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { Accept: 'text/html' },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get('Location');
        const next = location ? BandcampPage.parse(new URL(location, current.url).href) : null;
        if (!next || next.kind !== page.kind)
          throw new Error('Bandcamp redirected outside a supported recording page.');
        current = next;
        continue;
      }
      if (response.status === 404 || response.status === 410) {
        await response.body?.cancel();
        throw new BandcampNotFoundError();
      }
      if (!response.ok || response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'text/html') {
        await response.body?.cancel();
        throw new Error('Bandcamp could not be read. Retry.');
      }
      const html = await readBoundedText(response.body, 2 * 1024 * 1024);
      return recordingFromHtml(html, current);
    }
    throw new Error('Bandcamp redirected too many times.');
  };
  try {
    return await Promise.race([lookup(), timeout]);
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

export async function handleBandcampResolution(
  request: Request,
  identity: { role: number } | null | undefined,
  fetchPage: typeof fetch = fetch,
) {
  const url = new URL(request.url);
  const reject = async (status: number, detail: string) => {
    if (!request.bodyUsed) await request.body?.cancel();
    return cmsStringProblemResponse(status, 'BANDCAMP_RESOLUTION_FAILED', { detail });
  };
  if (url.pathname !== bandcampResolutionPath || url.search) return reject(404, 'Not found.');
  if (request.method !== 'POST') return reject(405, 'POST required.');
  if (
    !identity ||
    identity.role < 30 ||
    request.headers.get('Origin') !== url.origin ||
    request.headers.get('X-EmDash-Request') !== '1'
  )
    return reject(403, 'Editor access and a same-origin request are required.');
  let page: BandcampPage | null;
  try {
    if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json')
      throw new Error('JSON required');
    const command = commandSchema.parse(JSON.parse(await readBoundedText(request.body, 4096)));
    page = BandcampPage.parse(command.url);
  } catch {
    return reject(400, 'Use a Bandcamp album or track URL.');
  }
  if (!page) return reject(400, 'Use an HTTPS artist.bandcamp.com album or track URL.');
  try {
    const result = await resolveBandcampPage(page, fetchPage);
    if (result.status === 'provider_blocked')
      createWorkerLogger().warn({
        event: 'bandcamp_resolution_failed',
        path: bandcampResolutionPath,
        safeReason: 'provider_challenge',
        status: 200,
      });
    const data =
      result.status === 'resolved'
        ? { status: result.status, recording: result.recording.toJSON() }
        : result.status === 'not_found' && result.suggestion
          ? { status: result.status, suggestion: result.suggestion.url }
          : { status: result.status };
    return Response.json({ success: true, data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    createWorkerLogger().warn({
      event: 'bandcamp_resolution_failed',
      path: bandcampResolutionPath,
      ...normalizeUnknownError(error),
      status: 422,
    });
    return reject(422, 'Could not resolve this Bandcamp player. Retry, revert or clear.');
  }
}
