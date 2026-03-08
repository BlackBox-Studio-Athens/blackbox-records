import { LoaderCircle, type LucideProps } from 'lucide-react';

import { cn } from '@/lib/utils';

export function Spinner({ className, ...props }: LucideProps) {
  return <LoaderCircle aria-hidden="true" className={cn('animate-spin', className)} {...props} />;
}
