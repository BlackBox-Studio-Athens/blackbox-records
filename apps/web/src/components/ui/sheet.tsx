import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion, type MotionProps } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const SheetOpenContext = React.createContext(false);
type MotionRadixProps<T extends React.ElementType> = Omit<React.ComponentProps<T>, keyof MotionProps> & MotionProps;
const MotionSheetOverlay = motion.create(SheetPrimitive.Overlay) as React.ComponentType<
  MotionRadixProps<typeof SheetPrimitive.Overlay> & React.RefAttributes<HTMLDivElement>
>;
const MotionSheetContent = motion.create(SheetPrimitive.Content) as React.ComponentType<
  MotionRadixProps<typeof SheetPrimitive.Content> & React.RefAttributes<HTMLDivElement>
>;

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

const SheetPortal = SheetPrimitive.Portal;

function SheetOverlay() {
  const open = React.useContext(SheetOpenContext);
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open && (
        <MotionSheetOverlay
          key="sheet-overlay"
          forceMount
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: prefersReducedMotion ? 0 : 0.3 } }}
          exit={{ opacity: 0, transition: { duration: prefersReducedMotion ? 0 : 0.2 } }}
          className="fixed inset-0 z-50 bg-black/70"
        />
      )}
    </AnimatePresence>
  );
}

const sheetVariants = cva('fixed z-50 bg-card text-card-foreground shadow-xl', {
  variants: {
    side: {
      top: 'inset-x-0 top-0 border-b border-border',
      bottom: 'inset-x-0 bottom-0 border-t border-border',
      left: 'inset-y-0 left-0 h-full w-4/5 border-r border-border p-6 sm:max-w-sm',
      right: 'inset-y-0 right-0 h-full w-4/5 border-l border-border p-6 sm:max-w-sm',
    },
  },
  defaultVariants: {
    side: 'right',
  },
});

type SheetContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
  keyof MotionProps | 'forceMount'
> &
  VariantProps<typeof sheetVariants> & {
    children?: React.ReactNode;
  };

const SheetContent = React.forwardRef<React.ComponentRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => {
    const open = React.useContext(SheetOpenContext);
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
      <SheetPortal forceMount>
        <SheetOverlay />
        <AnimatePresence initial={false}>
          {open && (
            <MotionSheetContent
              key="sheet-content"
              ref={ref}
              forceMount
              initial={prefersReducedMotion ? false : offset}
              animate={{ x: 0, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeInOut' } }}
              exit={{ ...offset, transition: { duration: prefersReducedMotion ? 0 : 0.2, ease: 'easeInOut' } }}
              className={cn(sheetVariants({ side }), className)}
              {...props}
            >
              {children}
            </MotionSheetContent>
          )}
        </AnimatePresence>
      </SheetPortal>
    );
  },
);
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription };
