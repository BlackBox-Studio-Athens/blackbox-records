export const DIGITAL_RELEASE_BADGE = 'Digital out now';

export type PreorderShippingBadge = 'Pre-order' | `Pre-order · ships ${string}`;
export type PreorderBadge = PreorderShippingBadge | `Pre-order · out ${string}`;
export type PreorderBadges = [PreorderBadge] | [typeof DIGITAL_RELEASE_BADGE, PreorderShippingBadge];
export type ReleasePhysicalAvailability = 'available' | 'Coming Soon' | 'Repressing' | 'Sold Out';
export type ReleaseBadge =
  | typeof DIGITAL_RELEASE_BADGE
  | `Out ${string}`
  | PreorderBadge
  | `${'Vinyl' | 'CD' | 'Cassette'} ${ReleasePhysicalAvailability}`;
