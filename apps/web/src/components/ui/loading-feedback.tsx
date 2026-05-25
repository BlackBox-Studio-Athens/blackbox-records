import * as React from 'react';

import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

type LoadingInlineProps = React.HTMLAttributes<HTMLSpanElement> & {
  label: React.ReactNode;
  spinnerClassName?: string;
};

type LoadingMarkProps = {
  className?: string | undefined;
  spinnerClassName?: string | undefined;
};

function LoadingMark({ className, spinnerClassName }: LoadingMarkProps) {
  return (
    <span className={cn('loading-feedback-mark size-4 shrink-0', className)} aria-hidden="true">
      <span className="loading-feedback-mark__scale">
        <Spinner className={cn('size-3.5', spinnerClassName)} />
      </span>
    </span>
  );
}

export function LoadingInline({ className, label, spinnerClassName, ...props }: LoadingInlineProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn('inline-flex min-w-0 items-center gap-2 text-current', className)}
      {...props}
    >
      <LoadingMark spinnerClassName={spinnerClassName} />
      <span className="min-w-0">{label}</span>
    </span>
  );
}

type LoadingButtonContentProps = {
  className?: string;
  label: React.ReactNode;
  spinnerClassName?: string;
};

export function LoadingButtonContent({ className, label, spinnerClassName }: LoadingButtonContentProps) {
  return (
    <span className={cn('inline-flex min-w-0 items-center justify-center gap-2', className)}>
      <LoadingMark spinnerClassName={spinnerClassName} />
      <span className="min-w-0 leading-tight">{label}</span>
    </span>
  );
}

type LoadingStateBlockProps = React.HTMLAttributes<HTMLDivElement> & {
  description?: React.ReactNode;
  title: React.ReactNode;
};

export function LoadingStateBlock({ className, description, title, ...props }: LoadingStateBlockProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        'grid min-h-44 place-items-center border border-border/70 bg-background/55 p-5 text-center',
        className,
      )}
      {...props}
    >
      <div className="grid max-w-sm justify-items-center gap-3">
        <LoadingMark className="size-6 text-foreground/75" spinnerClassName="size-5" />
        <div className="grid gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">{title}</p>
          {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      </div>
    </div>
  );
}
