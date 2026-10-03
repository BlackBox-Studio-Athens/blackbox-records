import { publication, content } from '@/platform/content/purchase-information/site.json';
import type { ApprovedPurchaseInformation } from '@blackbox/content-model';

// Astro validates the entry. Draft wording is visible only in the local dev preview.
export function getPurchaseInformation(): ApprovedPurchaseInformation | null {
  return publication === 'approved' || import.meta.env.DEV ? content : null;
}

export const isPurchaseInformationDraft = publication !== 'approved';

// Browser readers bundle this module's entry, so pages need no inline copy. The hosted
// build replaces this module and inlines the published entry for its browser reader.
export const inlinesPurchaseInformation = false;

export { purchaseTermsHeadings, purchasePrivacyHeadings } from '@blackbox/content-model';
