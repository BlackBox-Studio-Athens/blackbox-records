import type { ApprovedPurchaseInformation } from '@blackbox/content-model';
import { publishedContext } from './published-reader';
export { purchaseTermsHeadings, purchasePrivacyHeadings } from '@blackbox/content-model';
export const isPurchaseInformationDraft = false;
export function getPurchaseInformation(): ApprovedPurchaseInformation | null {
  const data = publishedContext
    .getStore()
    ?.snapshot.records.find((record) => record.collection === 'purchase_information')?.data;
  return data?.publication === 'approved' ? (data.content as ApprovedPurchaseInformation) : null;
}
