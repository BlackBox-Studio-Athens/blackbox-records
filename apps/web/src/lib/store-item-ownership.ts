import { validateSlug } from './slugs';
import { reservedStoreRouteSegments } from './store-categories';

export type StoreItemSourceKind = 'distro' | 'release';

export type StoreItemProjectionCandidate = {
  physicalEditionKeys: readonly string[];
  sourceId: string;
  sourceKind: StoreItemSourceKind;
  storeItemSlug: string;
};

export type CanonicalStoreItemProjection = Omit<StoreItemProjectionCandidate, 'physicalEditionKeys'> & {
  variantId: string;
};

export function createPhysicalEditionKey(input: { artist: string; itemType: string; title: string }): string {
  return [input.artist, input.title, normalizePhysicalEditionType(input.itemType)].map(normalizeIdentityText).join('|');
}

export function createValidatedStoreItemProjection(
  candidates: readonly StoreItemProjectionCandidate[],
): CanonicalStoreItemProjection[] {
  if (candidates.length === 0) return [];

  const candidatesBySource = new Map<string, StoreItemProjectionCandidate>();

  for (const candidate of candidates) {
    const sourceKey = createSourceKey(candidate.sourceKind, candidate.sourceId);
    if (candidatesBySource.has(sourceKey)) {
      throw new Error(`Duplicate Store Item source tuple: ${sourceKey}.`);
    }
    candidatesBySource.set(sourceKey, candidate);
  }

  assertNoUnresolvedCrossSourceDuplicates(candidates);

  const projection = candidates.map((candidate): CanonicalStoreItemProjection => {
    const storeItemSlug = candidate.storeItemSlug;

    if (!validateSlug(storeItemSlug).valid) {
      throw new Error(
        `Invalid Store Item slug for ${createSourceKey(candidate.sourceKind, candidate.sourceId)}: ${storeItemSlug}.`,
      );
    }
    if (reservedStoreRouteSegments.has(storeItemSlug)) {
      throw new Error(
        `Reserved Store Item slug detected for ${createSourceKey(candidate.sourceKind, candidate.sourceId)}: ${storeItemSlug}.`,
      );
    }

    return {
      sourceId: candidate.sourceId,
      sourceKind: candidate.sourceKind,
      storeItemSlug,
      variantId: `variant_${storeItemSlug}_standard`,
    };
  });

  assertUniqueProjectionField(projection, 'storeItemSlug');
  assertUniqueProjectionField(projection, 'variantId');

  return projection;
}

function assertNoUnresolvedCrossSourceDuplicates(candidates: readonly StoreItemProjectionCandidate[]): void {
  const releases = candidates.filter((candidate) => candidate.sourceKind === 'release');
  const distro = candidates.filter((candidate) => candidate.sourceKind === 'distro');

  for (const release of releases) {
    const releaseKeys = new Set(release.physicalEditionKeys);
    for (const distroItem of distro) {
      const sharedKey = distroItem.physicalEditionKeys.find((key) => releaseKeys.has(key));
      if (sharedKey) {
        throw new Error(
          `Unresolved cross-source physical duplicate ${sharedKey}: release:${release.sourceId}, distro:${distroItem.sourceId}.`,
        );
      }
    }
  }
}

function assertUniqueProjectionField(
  projection: readonly CanonicalStoreItemProjection[],
  field: 'storeItemSlug' | 'variantId',
): void {
  const ownersByValue = new Map<string, string>();

  for (const entry of projection) {
    const value = entry[field];
    const owner = createSourceKey(entry.sourceKind, entry.sourceId);
    const existingOwner = ownersByValue.get(value);
    if (existingOwner) {
      throw new Error(`Duplicate ${field} ${value}: ${existingOwner}, ${owner}.`);
    }
    ownersByValue.set(value, owner);
  }
}

function createSourceKey(sourceKind: StoreItemSourceKind, sourceId: string): string {
  return `${sourceKind}:${sourceId}`;
}

function normalizePhysicalEditionType(value: string): string {
  const normalized = normalizeIdentityText(value);
  if (/\bvinyl\b|\blp\b/.test(normalized)) return 'vinyl';
  if (/\bcd\b/.test(normalized)) return 'cd';
  if (/\bcassette\b|\btape\b/.test(normalized)) return 'tape';
  if (/\bshirt\b|\btee\b|\bclothes\b/.test(normalized)) return 'clothing';
  return normalized;
}

function normalizeIdentityText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9\u0370-\u03ff]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
