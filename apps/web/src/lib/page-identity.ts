export function resolveSupportingLabel(sectionLabel: string | undefined, title: string) {
  if (!sectionLabel) return undefined;

  const normalizedLabel = sectionLabel.trim().replace(/\s+/g, ' ').toLowerCase();
  const normalizedTitle = title.trim().replace(/\s+/g, ' ').toLowerCase();
  return normalizedLabel && normalizedLabel !== normalizedTitle ? sectionLabel : undefined;
}
