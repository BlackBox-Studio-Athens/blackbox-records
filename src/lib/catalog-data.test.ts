import { describe, expect, it } from 'vitest';

import { groupDistroEntries } from './distro-data';

describe('groupDistroEntries', () => {
  it('returns distro groups in the intended editorial order and omits empty groups', () => {
    const entries = [
      { data: { group: 'Tapes', order: 5, title: 'C' } },
      { data: { group: 'Vinyls', order: 1, title: 'A' } },
      { data: { group: 'Clothes', order: 3, title: 'B' } },
    ] as any;

    const groups = groupDistroEntries(entries);

    expect(groups.map((group) => group.groupName)).toEqual(['Vinyls', 'Clothes', 'Tapes']);
    expect(groups[0]?.entries).toHaveLength(1);
    expect(groups[1]?.entries).toHaveLength(1);
    expect(groups[2]?.entries).toHaveLength(1);
  });
});
