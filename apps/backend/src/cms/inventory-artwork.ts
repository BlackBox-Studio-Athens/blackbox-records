import { ContentRepository } from 'emdash';
import type { EmDashRuntime } from 'emdash/middleware';
import { z } from 'zod';

const input = z
  .array(
    z.object({
      variantId: z.string().min(1).max(128),
      sourceKind: z.enum(['release', 'distro']),
      sourceId: z.string().min(1).max(200),
    }),
  )
  .max(50);

export async function readInventoryArtwork(request: Request, runtime: EmDashRuntime) {
  const parsed = input.safeParse(JSON.parse(new URL(request.url).searchParams.get('items') ?? '[]'));
  if (!parsed.success) return Response.json({ success: false }, { status: 400 });
  const repository = new ContentRepository(runtime.db);
  const items: { variantId: string; image: unknown }[] = [];
  await Promise.all(
    ['release', 'distro'].map(async (kind) => {
      const selected = parsed.data.filter((item) => item.sourceKind === kind);
      const content = await repository.findManyByIdOrSlug(
        kind === 'release' ? 'releases' : 'distro',
        selected.map((item) => item.sourceId),
      );
      for (const item of selected) {
        const entry = content.get(item.sourceId);
        items.push({
          variantId: item.variantId,
          image: entry?.data.cover_image ?? entry?.data.image ?? null,
        });
      }
    }),
  );
  return Response.json({ success: true, data: { items } }, { headers: { 'Cache-Control': 'private, no-store' } });
}
