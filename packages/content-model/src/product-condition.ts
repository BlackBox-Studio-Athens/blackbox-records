/** Physical publication needs an explicit owner-supplied condition; drafts may remain incomplete. */
export function requiresProductCondition(
  collection: string,
  data: Record<string, unknown>,
  hasPhysicalStoreBinding = false,
): boolean {
  return (
    collection === 'distro' ||
    (collection === 'releases' &&
      (hasPhysicalStoreBinding ||
        (Array.isArray(data.formats) &&
          data.formats.some(
            (format) => typeof format === 'string' && format.trim() !== '' && format.trim().toLowerCase() !== 'digital',
          ))))
  );
}

export function getPublicationProductConditionIssues(
  collection: string,
  data: Record<string, unknown>,
  hasPhysicalStoreBinding = false,
): string[] {
  return requiresProductCondition(collection, data, hasPhysicalStoreBinding) &&
    !['new', 'used'].includes(String(data.product_condition ?? ''))
    ? ['product_condition: Choose New or Used for this physical product before publishing.']
    : [];
}
