import { useEffect, useState } from 'react';

import { cn } from '@/components/ui/utils';

// Dot indicator for a native scroll-snap row. Look and timing follow ReUI c-carousel-11 (https://reui.io,
// MIT License, Copyright (c) 2025 Keenthemes Inc); each dot sits in a 24px button to meet WCAG 2.5.8.
// The row scrolls natively; the dots only read its scroll position, so swiping never waits for this island.

export function currentRowIndex({
  count,
  maxScrollLeft,
  scrollLeft,
  step,
}: {
  count: number;
  maxScrollLeft: number;
  scrollLeft: number;
  step: number;
}) {
  // A row that does not scroll (a wider layout shows it as a grid) rests on its first card.
  if (count < 2 || step <= 0 || maxScrollLeft <= 0) return 0;
  // The last card cannot reach the gutter, so the row ends before its snap point; at the end it is current.
  if (scrollLeft >= maxScrollLeft - 2) return count - 1;
  return Math.min(count - 1, Math.max(0, Math.round(scrollLeft / step)));
}

type SwipeRowDotsProps = {
  className?: string;
  count: number;
  label: string;
  rowId: string;
};

function cardOffset(row: HTMLElement, index: number) {
  const cards = row.children;
  const card = cards[index] as HTMLElement | undefined;
  return card ? card.offsetLeft - (cards[0] as HTMLElement).offsetLeft : 0;
}

export function SwipeRowDots({ className, count, label, rowId }: SwipeRowDotsProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const row = document.getElementById(rowId);
    if (!row) return;

    let frame = 0;
    const sync = () => {
      frame = 0;
      setCurrent(
        currentRowIndex({
          count,
          maxScrollLeft: row.scrollWidth - row.clientWidth,
          scrollLeft: row.scrollLeft,
          step: cardOffset(row, 1),
        }),
      );
    };
    const queueSync = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    // Resizing (rotation, or crossing into the grid layout) changes card widths without a scroll event.
    const resizeObserver = new ResizeObserver(queueSync);
    row.addEventListener('scroll', queueSync, { passive: true });
    resizeObserver.observe(row);
    sync();
    return () => {
      row.removeEventListener('scroll', queueSync);
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [count, rowId]);

  function showCard(index: number) {
    const row = document.getElementById(rowId);
    if (!row) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollTo({ left: cardOffset(row, index), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  if (count < 2) return null;

  return (
    <div role="group" aria-label={label} className={cn('flex justify-center', className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Show ${index + 1} of ${count}`}
          aria-current={index === current}
          onClick={() => showCard(index)}
          className={cn(
            'grid size-6 cursor-pointer place-items-center outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-foreground',
            'after:block after:h-2 after:rounded-full after:transition-all after:duration-500 after:ease-in-out motion-reduce:after:transition-none',
            index === current
              ? 'after:w-4 after:bg-foreground'
              : 'after:w-2 after:bg-muted-foreground after:opacity-30 hover:after:opacity-50',
          )}
        />
      ))}
    </div>
  );
}
