export const DIGITAL_RELEASE_BADGE = 'Digital out now';

export type PreorderShippingBadge = 'Pre-order' | `Pre-order · ships ${string}`;
export type PreorderBadge = PreorderShippingBadge | `Pre-order · out ${string}`;
export type PreorderBadges = [PreorderBadge] | [typeof DIGITAL_RELEASE_BADGE, PreorderShippingBadge];
export type ReleaseBadge =
  | typeof DIGITAL_RELEASE_BADGE
  | PreorderBadge
  | 'Album upcoming'
  | `${'Vinyl' | 'CD' | 'Cassette'} ${'available' | 'coming later'}`
  | 'Physical availability unconfirmed'
  | 'Sold Out'
  | 'Out of Stock'
  | 'Currently Unavailable';
