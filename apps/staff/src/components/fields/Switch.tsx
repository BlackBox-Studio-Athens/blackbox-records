import type { ReactNode } from 'react';

/** The track and knob drawn after a visually hidden role="switch" checkbox (its `peer`). */
export function SwitchTrack() {
  return (
    <span
      aria-hidden="true"
      className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border bg-muted transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-background after:content-[''] after:transition-transform peer-checked:border-primary peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50 motion-reduce:transition-none motion-reduce:after:transition-none"
    />
  );
}

/** A labelled on/off switch with its current state in words. */
export default function Switch({
  id,
  label,
  checked,
  onLabel = 'On',
  offLabel = 'Off',
  description,
  disabled = false,
  path,
  onChange,
}: {
  id: string;
  label: ReactNode;
  checked: boolean;
  onLabel?: string;
  offLabel?: string;
  description?: ReactNode;
  disabled?: boolean;
  path?: string;
  onChange(checked: boolean): void;
}) {
  return (
    <div className="grid gap-1">
      {/* relative: keeps the hidden checkbox beside its track, so focusing it never scrolls the editor. */}
      <label className="relative flex min-h-11 items-center justify-between gap-4" htmlFor={id}>
        <span className="grid gap-1">
          <span id={`${id}-label`} className="font-medium">
            {label}
          </span>
          <span className="text-sm text-muted-foreground">{checked ? onLabel : offLabel}</span>
        </span>
        <input
          id={id}
          data-content-path={path}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          aria-labelledby={`${id}-label`}
          aria-describedby={description ? `${id}-description` : undefined}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
        <SwitchTrack />
      </label>
      {description && (
        <p id={`${id}-description`} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
