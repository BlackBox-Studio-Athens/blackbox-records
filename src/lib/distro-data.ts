export const DISTRO_GROUP_ORDER = ['Vinyls', 'Clothes', 'Tapes'] as const;
export type DistroGroupName = (typeof DISTRO_GROUP_ORDER)[number];

export type DistroGroupingRecord<T> = {
  data: {
    group: DistroGroupName;
  };
} & T;

export function groupDistroEntries<T extends DistroGroupingRecord<object>>(entries: T[]) {
  return DISTRO_GROUP_ORDER.map((groupName) => ({
    groupName,
    entries: entries.filter((entry) => entry.data.group === groupName),
  })).filter((group) => group.entries.length > 0);
}
