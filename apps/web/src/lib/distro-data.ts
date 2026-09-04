export const DISTRO_GROUP_VALUES = [
  'Vinyl 12-inch',
  'Vinyl 10-inch',
  'Vinyl 7-inch',
  'CDs',
  'Clothes',
  'Tapes',
  'Other',
] as const;

export type DistroGroupName = (typeof DISTRO_GROUP_VALUES)[number];

export const DISTRO_INTRO_FIELDS = [
  { name: 'vinyl_12_inch', label: 'Vinyl 12-inch' },
  { name: 'vinyl_10_inch', label: 'Vinyl 10-inch' },
  { name: 'vinyl_7_inch', label: 'Vinyl 7-inch' },
  { name: 'CDs', label: 'CDs' },
  { name: 'Clothes', label: 'Clothes' },
  { name: 'Tapes', label: 'Tapes' },
  { name: 'Other', label: 'Other' },
] as const;

export type DistroIntroKey = (typeof DISTRO_INTRO_FIELDS)[number]['name'];

const DISTRO_BROWSE_GROUPS = [
  { groupName: 'Vinyl 12-inch', introKey: 'vinyl_12_inch', sourceGroups: ['Vinyl 12-inch'] },
  {
    groupName: '7-inch & 10-inch Vinyl',
    introKey: 'vinyl_7_inch',
    sourceGroups: ['Vinyl 7-inch', 'Vinyl 10-inch'],
  },
  { groupName: 'CDs', introKey: 'CDs', sourceGroups: ['CDs'] },
  { groupName: 'Tapes', introKey: 'Tapes', sourceGroups: ['Tapes'] },
  { groupName: 'Clothes', introKey: 'Clothes', sourceGroups: ['Clothes'] },
  { groupName: 'Other', introKey: 'Other', sourceGroups: ['Other'] },
] as const;

export type DistroGroupingRecord<T> = {
  data: {
    group: DistroGroupName;
    order: number;
    title: string;
  };
} & T;

export function sortDistroEntries<T extends DistroGroupingRecord<object>>(left: T, right: T) {
  if (left.data.order !== right.data.order) {
    return left.data.order - right.data.order;
  }

  return left.data.title.localeCompare(right.data.title);
}

export function groupDistroEntries<T extends DistroGroupingRecord<object>>(entries: T[]) {
  return DISTRO_BROWSE_GROUPS.map(({ groupName, introKey, sourceGroups }) => ({
    groupName,
    introKey,
    entries: entries
      .filter((entry) => sourceGroups.some((sourceGroup) => sourceGroup === entry.data.group))
      .sort(sortDistroEntries),
  })).filter((group) => group.entries.length > 0);
}
