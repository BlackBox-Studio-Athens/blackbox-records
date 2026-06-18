import slugify from '@sindresorhus/slugify';

export const slugPatternSource = '^[a-z0-9]+(?:-[a-z0-9]+)*$';
const slugPattern = new RegExp(slugPatternSource);

export type SlugValidationResult =
  | {
      slug: string;
      valid: true;
    }
  | {
      reason: 'blank' | 'format';
      slug: string;
      valid: false;
    };

export type SlugCollision = {
  owners: string[];
  slug: string;
};

export function createSlugSuggestion(value: string): string {
  return slugify(value, {
    lowercase: true,
  });
}

export function validateSlug(value: string): SlugValidationResult {
  const slug = value.trim();

  if (!slug) {
    return { reason: 'blank', slug, valid: false };
  }

  if (!slugPattern.test(slug)) {
    return { reason: 'format', slug, valid: false };
  }

  return { slug, valid: true };
}

export function resolveExplicitOrSuggestedSlug(explicitSlug: string, fallbackValue: string): string {
  const validation = validateSlug(explicitSlug);

  if (validation.valid) {
    return validation.slug;
  }

  return createSlugSuggestion(fallbackValue);
}

export function findSlugCollisions(entries: Array<{ owner: string; slug: string }>): SlugCollision[] {
  const ownersBySlug = new Map<string, string[]>();

  entries.forEach((entry) => {
    const owners = ownersBySlug.get(entry.slug) ?? [];
    owners.push(entry.owner);
    ownersBySlug.set(entry.slug, owners);
  });

  return Array.from(ownersBySlug.entries())
    .filter(([, owners]) => owners.length > 1)
    .map(([slug, owners]) => ({ owners, slug }));
}

export function assertNoSlugCollisions(entries: Array<{ owner: string; slug: string }>): void {
  const collisions = findSlugCollisions(entries);

  if (collisions.length === 0) {
    return;
  }

  const formattedCollisions = collisions
    .map((collision) => `${collision.slug}: ${collision.owners.join(', ')}`)
    .join('; ');

  throw new Error(`Slug collision detected: ${formattedCollisions}`);
}
