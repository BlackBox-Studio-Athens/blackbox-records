import { useId } from 'react';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { cn } from '../ui/utils';

/** Two to four mutually exclusive options shown side by side; one is always chosen once set. */
export default function SegmentedChoice<T extends string>({
  label,
  value,
  options,
  onChange,
  path,
  disabled = false,
  invalid = false,
  describedBy,
  className,
}: {
  label: string;
  value: T | undefined;
  options: readonly { value: T; label: string }[];
  onChange(value: T): void;
  path?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Ids of the hint and error that explain this choice. */
  describedBy?: string | undefined;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn('grid min-w-0 gap-2', className)}>
      <span id={`${id}-label`} className="text-sm font-medium">
        {label}
      </span>
      <ToggleGroup
        type="single"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={value ?? ''}
        disabled={disabled}
        // Radix lets a second press clear the choice; keep the current value instead.
        onValueChange={(next) => next && onChange(next as T)}
        className="grid gap-0 overflow-hidden rounded-md border border-input"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option, index) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            data-content-path={path && (option.value === value || (!value && index === 0)) ? path : undefined}
            className="rounded-none border-0 border-r border-input text-base last:border-r-0 data-[state=on]:bg-accent data-[state=on]:font-semibold data-[state=on]:text-accent-foreground"
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
