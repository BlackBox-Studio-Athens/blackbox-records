import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/components/ui/utils';

// The public button family: square, flat, Bebas Neue caps. Sizes are 32 / 36 / 44px.
// Tailwind's hover variant is already gated by (hover: hover). On coarse pointers an invisible
// ::before halo grows the tap target to 44px without changing the drawn size.
// `site-button--*` marker classes let section tone rules in global.css address outlined buttons.
const buttonVariantClasses = cva(
  [
    'site-button relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap',
    'rounded-none border pt-px font-display leading-none font-normal tracking-[0.06em] uppercase',
    'transition-[color,background-color,border-color,box-shadow,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
    'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground focus-visible:ring-0 focus-visible:ring-offset-0',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45',
    'aria-busy:cursor-progress',
    'pointer-coarse:before:absolute pointer-coarse:before:-inset-1',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default:
          'site-button--primary border-control-ink bg-control-ink text-primary-foreground hover:border-foreground hover:bg-foreground active:border-control-ink-pressed active:bg-control-ink-pressed active:shadow-[inset_0_0_0_1px_rgba(13,13,13,0.22)]',
        outline:
          'site-button--outline border-control-edge bg-secondary text-foreground hover:border-control-edge-hover hover:bg-control-face-hover active:bg-card',
        ghost: [
          'site-button--ghost border-transparent bg-transparent text-muted-foreground hover:text-foreground active:text-control-muted-pressed',
          'after:pointer-events-none after:absolute after:inset-x-1.5 after:bottom-2.5 after:h-px after:origin-center after:scale-x-0 after:bg-current',
          'after:transition-transform after:duration-250 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:after:scale-x-100 motion-reduce:after:transition-none',
        ],
        link: 'site-button--link',
        chip: 'site-button--chip border-control-edge-quiet bg-secondary text-muted-foreground hover:border-control-edge-hover hover:text-foreground aria-pressed:border-foreground aria-pressed:bg-control-face-selected aria-pressed:text-foreground',
      },
      size: {
        sm: "min-h-8 gap-1.5 px-2.5 text-[13px] pointer-coarse:before:-inset-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        default: 'min-h-9 px-3 text-sm',
        lg: "min-h-11 px-4 text-base [&_svg:not([class*='size-'])]:size-[18px]",
        icon: 'site-button--icon size-9 p-0',
        'icon-lg': "site-button--icon size-11 p-0 [&_svg:not([class*='size-'])]:size-[18px]",
      },
    },
    compoundVariants: [
      // Icon controls sit on a quieter edge and never take a section tone.
      { variant: 'outline', size: ['icon', 'icon-lg'], class: 'border-control-edge-quiet' },
      { variant: ['default', 'outline'], size: 'default', class: 'min-w-24' },
      { variant: ['default', 'outline'], size: 'lg', class: 'min-w-28' },
      { variant: 'ghost', size: ['sm', 'default', 'lg'], class: 'px-1.5' },
      {
        // Text actions stay in the reading face: Inter 13/500, faint underline at rest.
        variant: 'link',
        class:
          'min-h-9 min-w-0 border-0 bg-transparent px-0 pt-0 font-sans text-[13px] font-medium tracking-normal text-muted-foreground normal-case underline decoration-foreground/30 decoration-1 underline-offset-4 hover:text-foreground hover:decoration-foreground active:text-control-muted-pressed',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

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
