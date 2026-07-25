import { resolveExplicitOrSuggestedSlug } from '../slugs';

export function resolveArtistSlugForSave(slug: string, title: string): string {
  return resolveExplicitOrSuggestedSlug(slug, title);
}
