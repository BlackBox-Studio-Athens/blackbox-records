'use client';

import * as React from 'react';
import type { MotionProps } from 'motion/react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { cn } from '../../lib/utils';

const SheetOpenContext = React.createContext(false);
const MotionSheetSurface = React.lazy(() => import('./motion-sheet-surface'));

function Sheet({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;

  return (
    <SheetOpenContext.Provider value={open}>
      <SheetPrimitive.Root
        data-slot="sheet"
        {...props}
        open={open}
        onOpenChange={(nextOpen) => {
          if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
          onOpenChange?.(nextOpen);
        }}
      />
    </SheetOpenContext.Provider>
  );
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

type MotionSheetContentProps = Omit<React.ComponentProps<typeof SheetPrimitive.Content>, keyof MotionProps> & {
  children?: React.ReactNode;
};

function SheetContent({
  className,
  children,
  side = 'right',
  showCloseButton = true,
  ...props
}: MotionSheetContentProps & {
  side?: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton?: boolean;
}) {
  const open = React.useContext(SheetOpenContext);
  const [hasOpened, setHasOpened] = React.useState(open);
  React.useEffect(() => {
    if (open) setHasOpened(true);
  }, [open]);

  return (
    <SheetPortal forceMount>
      {hasOpened && (
        <React.Suspense fallback={null}>
          <MotionSheetSurface
            open={open}
            side={side}
            showCloseButton={showCloseButton}
            className={className}
            {...props}
          >
            {children}
          </MotionSheetSurface>
        </React.Suspense>
      )}
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-header" className={cn('flex flex-col gap-1.5 p-4', className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn('font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription };
