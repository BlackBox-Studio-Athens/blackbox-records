'use client';

import * as React from 'react';
import { AnimatePresence, motion, useReducedMotion, type MotionProps } from 'motion/react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { cn } from '../../lib/utils';
import { XIcon } from 'lucide-react';

type MotionRadixProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, keyof MotionProps> & MotionProps;
const MotionSheetOverlay = motion.create(SheetPrimitive.Overlay) as React.ComponentType<
  MotionRadixProps<typeof SheetPrimitive.Overlay> & React.RefAttributes<HTMLDivElement>
>;
const MotionSheetContent = motion.create(SheetPrimitive.Content) as React.ComponentType<
  MotionRadixProps<typeof SheetPrimitive.Content> & React.RefAttributes<HTMLDivElement>
>;

type MotionSheetContentProps = Omit<React.ComponentProps<typeof SheetPrimitive.Content>, keyof MotionProps> & {
  children?: React.ReactNode;
  open: boolean;
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
};

export default function MotionSheetSurface({
  open,
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: MotionSheetContentProps) {
  const prefersReducedMotion = useReducedMotion();
  const offset =
    side === 'left'
      ? { x: '-100%', y: 0 }
      : side === 'right'
        ? { x: '100%', y: 0 }
        : side === 'top'
          ? { x: 0, y: '-100%' }
          : { x: 0, y: '100%' };

  return (
    <>
      <AnimatePresence initial={false}>
        {open && (
          <MotionSheetOverlay
            key="sheet-overlay"
            forceMount
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: prefersReducedMotion ? 0 : 0.5 } }}
            exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0 : 0.3 } }}
            data-slot="sheet-overlay"
            className="fixed inset-0 z-50 bg-black/50"
          />
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {open && (
          <MotionSheetContent
            key="sheet-content"
            forceMount
            initial={prefersReducedMotion ? false : offset}
            animate={{ x: 0, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeInOut' } }}
            exit={{ ...offset, transition: { duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeInOut' } }}
            data-slot="sheet-content"
            className={cn(
              'fixed z-50 flex flex-col gap-4 bg-background shadow-lg',
              side === 'right' && 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
              side === 'left' && 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
              side === 'top' && 'inset-x-0 top-0 h-auto border-b',
              side === 'bottom' && 'inset-x-0 bottom-0 h-auto border-t',
              className,
            )}
            {...props}
          >
            {children}
            {showCloseButton && (
              <SheetPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-secondary">
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </SheetPrimitive.Close>
            )}
          </MotionSheetContent>
        )}
      </AnimatePresence>
    </>
  );
}
