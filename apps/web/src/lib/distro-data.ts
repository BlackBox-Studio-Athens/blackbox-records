export type DistroGroupName =
  | 'Vinyl 12-inch'
  | 'Vinyl 10-inch'
  | 'Vinyl 7-inch'
  | 'CDs'
  | 'Clothes'
  | 'Tapes'
  | 'Other';

const DISTRO_BROWSE_GROUPS = [
  { groupName: 'Vinyl 12-inch', introGroupName: 'Vinyl 12-inch', sourceGroups: ['Vinyl 12-inch'] },
  {
    groupName: '7-inch & 10-inch Vinyl',
    introGroupName: 'Vinyl 7-inch',
    sourceGroups: ['Vinyl 7-inch', 'Vinyl 10-inch'],
  },
  { groupName: 'CDs', introGroupName: 'CDs', sourceGroups: ['CDs'] },
  { groupName: 'Tapes', introGroupName: 'Tapes', sourceGroups: ['Tapes'] },
  { groupName: 'Clothes', introGroupName: 'Clothes', sourceGroups: ['Clothes'] },
  { groupName: 'Other', introGroupName: 'Other', sourceGroups: ['Other'] },
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
  return DISTRO_BROWSE_GROUPS.map(({ groupName, introGroupName, sourceGroups }) => ({
    groupName,
    introGroupName,
    entries: entries
      .filter((entry) => sourceGroups.some((sourceGroup) => sourceGroup === entry.data.group))
      .sort(sortDistroEntries),
  })).filter((group) => group.entries.length > 0);
}
