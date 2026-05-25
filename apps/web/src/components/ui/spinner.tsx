import type { ComponentProps } from 'react';

import * as React from 'react';
import { LoaderCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

type SpinnerProps = ComponentProps<typeof LoaderCircle>;

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <LoaderCircle aria-hidden="true" className={cn('animate-spin motion-reduce:animate-none', className)} {...props} />
  );
}
