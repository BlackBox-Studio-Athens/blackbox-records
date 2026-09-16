import { publication, content } from '@/content/purchase-information/site.json';
import type { ApprovedPurchaseInformation } from '@blackbox/content-model';

// Astro validates the entry. Draft wording is visible only in the local dev preview.
export function getPurchaseInformation(): ApprovedPurchaseInformation | null {
  return publication === 'approved' || import.meta.env.DEV ? content : null;
}

export const isPurchaseInformationDraft = publication !== 'approved';

export { purchaseTermsHeadings, purchasePrivacyHeadings } from '@blackbox/content-model';
