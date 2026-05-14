export function scrollShellTargetIntoView({
  documentRoot = document,
  overlayScrollContainer,
  targetId,
  triggerElement,
}: {
  documentRoot?: Pick<Document, 'querySelector'>;
  overlayScrollContainer: HTMLElement | null;
  targetId: string;
  triggerElement?: HTMLElement | null | undefined;
}) {
  const overlayScrollRoot =
    triggerElement && overlayScrollContainer?.contains(triggerElement) ? overlayScrollContainer : null;
  const targetElement =
    overlayScrollRoot?.querySelector<HTMLElement>(`[id="${targetId}"]`) ||
    documentRoot.querySelector<HTMLElement>(`[id="${targetId}"]`);

  if (!targetElement) return false;

  if (overlayScrollRoot && overlayScrollRoot.contains(targetElement)) {
    const overlayScrollRootRect = overlayScrollRoot.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();
    const nextScrollTop = overlayScrollRoot.scrollTop + (targetRect.top - overlayScrollRootRect.top) - 16;

    overlayScrollRoot.scrollTo({
      top: Math.max(nextScrollTop, 0),
      behavior: 'smooth',
    });
  } else {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  return true;
}
