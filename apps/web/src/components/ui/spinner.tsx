import type { ComponentProps } from 'react';

import * as React from 'react';
import { LoaderCircle } from 'lucide-react';

type SpinnerProps = ComponentProps<typeof LoaderCircle>;

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={['animate-spin motion-reduce:animate-none', className].filter(Boolean).join(' ')}
      {...props}
    />
  );
}
