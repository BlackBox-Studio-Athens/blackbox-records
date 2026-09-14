import type { DistroGroupName } from '@blackbox/content-model';

const DISTRO_BROWSE_GROUPS = [
  { groupName: 'Vinyl 12-inch', introKey: 'vinyl_12_inch', sourceGroups: ['Vinyl 12-inch'] },
  { groupName: 'Vinyl 10-inch', introKey: 'vinyl_10_inch', sourceGroups: ['Vinyl 10-inch'] },
  { groupName: 'Vinyl 7-inch', introKey: 'vinyl_7_inch', sourceGroups: ['Vinyl 7-inch'] },
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
