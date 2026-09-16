import type { ApprovedPurchaseInformation } from '@blackbox/content-model';
export { purchaseTermsHeadings, purchasePrivacyHeadings } from '@blackbox/content-model';
export const isPurchaseInformationDraft = false;
export function getPurchaseInformation(): ApprovedPurchaseInformation | null {
  return JSON.parse(document.getElementById('purchase-information')?.textContent ?? 'null');
}
