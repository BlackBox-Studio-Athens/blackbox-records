import { publication, content } from '@/content/purchase-information/site.json';
import type { ApprovedPurchaseInformation } from './purchase-information-schema';

// Astro validates the entry. Draft wording is visible only in the local dev preview.
export function getPurchaseInformation(): ApprovedPurchaseInformation | null {
  return publication === 'approved' || import.meta.env.DEV ? content : null;
}

export const isPurchaseInformationDraft = publication !== 'approved';

export const purchaseTermsHeadings = {
  dispatch: 'Dispatch timing',
  delivery: 'Locker delivery',
  returns: 'Returns and refunds',
  damaged_items: 'Damaged items',
  uncollected_parcels: 'Uncollected parcels',
} as const;

export const purchasePrivacyHeadings = {
  purposes: 'How we use your information',
  recipients: 'Who receives your information',
  retention: 'How long we keep information',
  rights: 'Your rights',
  contact: 'Privacy contact',
} as const;
