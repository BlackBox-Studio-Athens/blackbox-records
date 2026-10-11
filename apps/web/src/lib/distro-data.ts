import type { DistroGroupName } from '@blackbox/content-model';

const DISTRO_BROWSE_GROUPS = [
  { groupName: 'Vinyl 12-inch', introKey: 'vinyl_12_inch' },
  { groupName: 'Vinyl 10-inch', introKey: 'vinyl_10_inch' },
  { groupName: 'Vinyl 7-inch', introKey: 'vinyl_7_inch' },
  { groupName: 'CDs', introKey: 'CDs' },
  { groupName: 'Tapes', introKey: 'Tapes' },
  { groupName: 'Clothes', introKey: 'Clothes' },
  { groupName: 'Other', introKey: 'Other' },
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
  return DISTRO_BROWSE_GROUPS.map(({ groupName, introKey }) => ({
    groupName,
    introKey,
    entries: entries.filter((entry) => entry.data.group === groupName).sort(sortDistroEntries),
  })).filter((group) => group.entries.length > 0);
}
