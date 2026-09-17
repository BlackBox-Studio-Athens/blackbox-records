import { DISTRO_GROUP_VALUES } from '@blackbox/content-model';

export function formatLabel(value: string) {
  return value.replace(/^Vinyl (\d+)-inch$/, '$1-inch vinyl');
}

export default function FormatFilter({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label="Format"
      className="min-h-11 border border-border bg-background p-2"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">All formats</option>
      {DISTRO_GROUP_VALUES.map((format) => (
        <option key={format} value={format}>
          {formatLabel(format)}
        </option>
      ))}
    </select>
  );
}
