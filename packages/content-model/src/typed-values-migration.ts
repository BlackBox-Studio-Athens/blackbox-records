import { parseArtistCountries } from './artist-fields';
import { DISTRO_GROUP_VALUES, isHttpsUrl } from './validation';
import { parseDuration } from './values';
import { generateServiceIds, readSocialValues } from './schemas';
import { tracklistFormat } from './tracklist';

const flags: Record<string, readonly string[]> = {
  artists: ['is_active'],
  releases: ['show_on_home'],
  navigation: ['show_in_header', 'show_in_footer'],
  socials: ['visible'],
};

/** Plan one record atomically. Unknown legacy values leave the whole record unchanged. */
export function convertTypedValues(collection: string, input: Record<string, unknown>) {
  let data = structuredClone(input);
  const problems: string[] = [];
  if (collection === 'artists' && data.country === '') data.country = [];
  else if (collection === 'artists' && data.country !== undefined && data.country !== null) {
    const value = data.country;
    const countries =
      typeof value === 'string' || (Array.isArray(value) && value.every((v) => typeof v === 'string'))
        ? parseArtistCountries(value)
        : null;
    if (countries) data.country = countries;
    else problems.push('country');
  }
  if (collection === 'socials') data = readSocialValues(data);
  for (const field of flags[collection] ?? []) {
    const value = data[field];
    if (value === undefined) continue;
    if (value === null || value === '') {
      delete data[field];
      continue;
    }
    if (value === 1 || value === '1' || value === 'true') data[field] = true;
    else if (value === 0 || value === '0' || value === 'false') data[field] = false;
    else if (typeof value !== 'boolean') problems.push(field);
  }
  if (collection === 'socials' && data.visible === true && (typeof data.url !== 'string' || !isHttpsUrl(data.url)))
    problems.push('url');
  if (collection === 'distro' && data.group !== undefined && data.group !== null) {
    if (!DISTRO_GROUP_VALUES.includes(data.group as (typeof DISTRO_GROUP_VALUES)[number])) problems.push('group');
    else {
      const legacyLabel = data.format;
      if (legacyLabel !== undefined && legacyLabel !== null && typeof legacyLabel !== 'string') problems.push('format');
      else {
        data.format = data.group;
        data.format_override = legacyLabel ?? '';
        delete data.group;
      }
    }
  }
  if (collection === 'distro' && data.group === null) delete data.group;
  if (
    collection === 'distro' &&
    (data.group === undefined || data.group === null) &&
    data.format !== undefined &&
    data.format !== null &&
    data.format !== '' &&
    !DISTRO_GROUP_VALUES.includes(data.format as (typeof DISTRO_GROUP_VALUES)[number])
  )
    problems.push('format');
  if (['releases', 'distro'].includes(collection) && data.tracklist && typeof data.tracklist === 'object') {
    const tracklist = data.tracklist as Record<string, unknown>;
    if (
      collection === 'distro' &&
      tracklist.format !== undefined &&
      tracklist.format !== null &&
      tracklist.format !== tracklistFormat(String(data.format ?? ''))
    )
      problems.push('tracklist.format');
    const groups = tracklist.discs ?? tracklist.sides;
    if (!Array.isArray(groups)) problems.push('tracklist');
    else
      for (const [groupIndex, group] of groups.entries()) {
        if (!group || typeof group !== 'object' || !Array.isArray(group.tracks)) {
          problems.push(`tracklist.${groupIndex}`);
          continue;
        }
        for (const [trackIndex, track] of group.tracks.entries()) {
          if (!track || typeof track !== 'object') {
            problems.push(`tracklist.${groupIndex}.${trackIndex}`);
            continue;
          }
          if (track.duration === undefined) continue;
          if (track.duration === null || track.duration === '') {
            delete track.duration;
            continue;
          }
          if (typeof track.duration === 'string') {
            const duration = parseDuration(track.duration);
            if (duration === null) problems.push(`tracklist.${groupIndex}.${trackIndex}.duration`);
            else track.duration = duration;
          } else if (!Number.isSafeInteger(track.duration) || track.duration < 0)
            problems.push(`tracklist.${groupIndex}.${trackIndex}.duration`);
        }
      }
    if (collection === 'distro') delete tracklist.format;
  }
  if (collection === 'services') data = generateServiceIds(data);
  return problems.length ? { data: input, problems } : { data, problems };
}

/** Read old or new stored values without mutating the original revision. */
export function readTypedValues(collection: string, data: Record<string, unknown>) {
  const result = convertTypedValues(collection, data);
  const converted =
    collection === 'distro' && result.problems.length === 1 && result.problems[0] === 'tracklist.format'
      ? convertTypedValues(collection, { ...data, tracklist: null }).data
      : result.data;
  if (collection === 'artists') return { ...data, country: converted.country };
  if (collection === 'releases') return { ...data, tracklist: converted.tracklist };
  if (collection === 'distro') return converted;
  return data;
}

/** Keep the existing public Distro group, label and tracklist presentation. */
export function projectDistroValues(data: Record<string, unknown>) {
  const typed = readTypedValues('distro', data);
  const group = typed.format;
  const fallback = group === 'CDs' ? 'CD' : group === 'Tapes' ? 'Cassette' : group;
  const tracklist = typed.tracklist;
  return {
    ...typed,
    group,
    format: typed.format_override ?? fallback,
    ...(tracklist && typeof tracklist === 'object'
      ? { tracklist: { ...tracklist, format: tracklistFormat(String(group ?? '')) } }
      : {}),
  };
}
