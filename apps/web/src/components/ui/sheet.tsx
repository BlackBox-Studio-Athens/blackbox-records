import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/components/ui/utils';

// Enter and exit motion is CSS keyframes on Radix data-state (global.css `.ui-sheet-*`): Radix Presence keeps the
// closing content mounted until its animationend, and reduced motion removes the animation so it unmounts at once.
const Sheet = SheetPrimitive.Root;

const SheetPortal = SheetPrimitive.Portal;

function SheetOverlay() {
  return <SheetPrimitive.Overlay className="ui-sheet-overlay fixed inset-0 z-50 bg-black/70" />;
}

const sheetVariants = cva('ui-sheet-content fixed z-50 bg-card text-card-foreground shadow-xl', {
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

type SheetContentProps = Omit<React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>, 'forceMount'> &
  VariantProps<typeof sheetVariants> & {
    children?: React.ReactNode;
  };

const SheetContent = React.forwardRef<React.ComponentRef<typeof SheetPrimitive.Content>, SheetContentProps>(
  ({ side = 'right', className, children, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        data-side={side ?? 'right'}
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  ),
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
