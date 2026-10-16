import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/components/ui/utils';

// The public button family: square, flat, Bebas Neue caps, white labels except on the ink face. One drawn size, 44px;
// the Home hero CTA is the single 48px exception (openspec/changes/accent-and-button-system). Tailwind's hover variant is
// already gated by (hover: hover). On coarse pointers an invisible ::before halo adds room around the drawn box.
// Buy and Pre-order colours live on global.css .purchase-action and .preorder-action, which the listing code toggles.
// The shared box, type, focus, disabled, touch-halo and icon rules live once in global.css `.site-button` (components
// layer), which keeps them out of every island bundle; the variant and caller utilities below still override them.
const buttonVariantClasses = cva('site-button', {
  variants: {
    variant: {
      default:
        'site-button--primary border-control-ink bg-control-ink text-primary-foreground hover:border-foreground hover:bg-foreground active:border-control-ink-pressed active:bg-control-ink-pressed active:shadow-[inset_0_0_0_1px_rgba(13,13,13,0.22)]',
      outline:
        'site-button--outline border-control-edge bg-secondary text-foreground hover:border-control-edge-hover hover:bg-control-face-hover active:bg-card',
      // Browse actions (Read News, View Full Roster, Continue shopping): charcoal face, Flint edge, white label.
      inverse:
        'site-button--inverse border-flint-700 bg-secondary text-foreground hover:border-flint-500 hover:bg-flint-surface',
      // The underline that grows from the centre on hover is global.css .site-button--ghost::after.
      ghost:
        'site-button--ghost border-transparent bg-transparent text-muted-foreground hover:text-foreground active:text-control-muted-pressed',
      link: 'site-button--link',
      chip: 'site-button--chip group border-control-edge-quiet bg-secondary text-muted-foreground hover:border-control-edge-hover hover:text-foreground aria-pressed:border-flint-500 aria-pressed:bg-flint-surface aria-pressed:text-foreground',
    },
    size: {
      default: 'min-h-11 px-4 text-base',
      hero: 'site-button--hero min-h-12 gap-2.75 pr-4.5 pl-5.5 text-lg',
      icon: 'site-button--icon size-11 p-0',
    },
  },
  compoundVariants: [
    // Icon controls sit on a quieter edge and never take an accent.
    { variant: 'outline', size: 'icon', class: 'border-control-edge-quiet' },
    { variant: ['default', 'outline', 'inverse'], size: 'default', class: 'min-w-28' },
    { variant: 'ghost', size: 'default', class: 'px-1.5' },
    {
      // Text actions stay in the reading face: Inter 13/500 in a 44px row, faint underline at rest, amber on hover.
      variant: 'link',
      class:
        'min-h-11 min-w-0 border-0 bg-transparent px-0 pt-0 font-sans text-[13px] font-medium tracking-normal text-muted-foreground normal-case underline decoration-foreground/30 decoration-1 underline-offset-4 hover:text-foreground hover:decoration-amber-500 active:text-control-muted-pressed',
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type ButtonVariantProps = VariantProps<typeof buttonVariantClasses>;

// cva concatenates; merging here lets Astro callers use the class string directly without conflicts.
function buttonVariants(props?: Parameters<typeof buttonVariantClasses>[0]) {
  return cn(buttonVariantClasses(props));
}

export type ButtonProps = React.ComponentProps<'button'> &
  ButtonVariantProps & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? 'default'}
      data-size={size ?? 'default'}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}

export { Button, buttonVariants };
