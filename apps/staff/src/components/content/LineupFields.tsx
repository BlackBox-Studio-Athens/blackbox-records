import { ArrowDown, ArrowUp, Mic2, Plus, Trash2, Type } from 'lucide-react';
import EditorialPicker from './EditorialPicker';
import SegmentedChoice from '../fields/SegmentedChoice';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '../ui/field';

const roleOptions = [
  { value: 'headliner', label: 'Headliner' },
  { value: 'opening', label: 'Opening act' },
] as const;
const kindOptions = [
  { value: 'artist', label: 'Label artist' },
  { value: 'name', label: 'Name only' },
] as const;

export type LineupEntry = {
  role: 'headliner' | 'opening';
  artist?: string | undefined;
  name?: string | undefined;
  release?: string | undefined;
};

/** An ordered show lineup: label Artists or plain names, each a Headliner or an Opening act. */
export default function LineupFields({
  base,
  value,
  onChange,
  errorsFor,
  disabled = false,
}: {
  base: string;
  value: LineupEntry[];
  onChange(value: LineupEntry[]): void;
  /** Messages reported at exactly `lineup` or `lineup.<index>.<field>`. */
  errorsFor(path: string): string[];
  disabled?: boolean;
}) {
  function update(index: number, change: Partial<LineupEntry>) {
    onChange(value.map((entry, at) => (at === index ? clean({ ...entry, ...change }) : entry)));
  }
  function move(index: number, delta: number) {
    const next = [...value];
    [next[index], next[index + delta]] = [next[index + delta]!, next[index]!];
    onChange(next);
  }
  const listErrors = errorsFor('lineup');
  return (
    <FieldSet
      disabled={disabled}
      className="col-span-full min-w-0 gap-4"
      data-content-path="lineup"
      data-invalid={listErrors.length > 0}
    >
      <FieldLegend icon={Mic2} required>
        Lineup
      </FieldLegend>
      <FieldDescription>
        In billing order. Add at least one Headliner. Choose a label artist to link their page, or type a name for a
        guest act.
      </FieldDescription>
      <FieldError>{listErrors.join(' ')}</FieldError>
      {value.map((entry, index) => {
        const kind = entry.artist !== undefined ? 'artist' : 'name';
        const id = `lineup-${index}`;
        const rowErrors = (field: string) => errorsFor(`lineup.${index}.${field}`);
        // The shared rule reports a row with neither Artist nor name at `artist`.
        const nameErrors = [...rowErrors('name'), ...rowErrors('artist')];
        return (
          <fieldset
            key={index}
            className="grid min-w-0 gap-4 border-t border-border pt-4 @2xl:grid-cols-2"
            data-lineup-row={index}
          >
            <legend className="sr-only">Act {index + 1}</legend>
            <div className="col-span-full grid min-w-0 gap-4 @md:grid-cols-2">
              <SegmentedChoice
                label="Billing"
                value={entry.role}
                options={roleOptions}
                disabled={disabled}
                onChange={(role) => update(index, { role })}
              />
              <SegmentedChoice
                label="Act"
                value={kind}
                options={kindOptions}
                disabled={disabled}
                onChange={(next) =>
                  next !== kind &&
                  update(
                    index,
                    next === 'artist'
                      ? { artist: '', name: undefined }
                      : { artist: undefined, release: undefined, name: '' },
                  )
                }
              />
            </div>
            {kind === 'artist' ? (
              <EditorialPicker
                base={base}
                collection="artists"
                label="Artist"
                path={`lineup.${index}.artist`}
                value={entry.artist ?? ''}
                error={rowErrors('artist').join(' ') || undefined}
                onSelect={(item) => update(index, { artist: item.id, release: undefined })}
              />
            ) : (
              <Field data-invalid={nameErrors.length > 0}>
                <FieldLabel htmlFor={`${id}-name`} icon={Type} required>
                  Act name
                </FieldLabel>
                <Input
                  id={`${id}-name`}
                  data-content-path={`lineup.${index}.name`}
                  value={entry.name ?? ''}
                  aria-invalid={nameErrors.length > 0 || undefined}
                  aria-describedby={`${id}-name-error`}
                  onChange={(event) => update(index, { name: event.target.value })}
                />
                <FieldError id={`${id}-name-error`}>{nameErrors.join(' ')}</FieldError>
              </Field>
            )}
            {kind === 'artist' && entry.role === 'headliner' && entry.artist ? (
              <EditorialPicker
                key={entry.artist}
                base={base}
                collection="releases"
                label="Release"
                path={`lineup.${index}.release`}
                value={entry.release ?? ''}
                required={false}
                filter={(item) => 'data' in item && item.data.artist === entry.artist}
                error={rowErrors('release').join(' ') || undefined}
                onSelect={(item) => update(index, { release: item.id })}
                onClear={() => update(index, { release: undefined })}
              />
            ) : (
              <div aria-hidden="true" className="hidden @2xl:block" />
            )}
            <div className="col-span-full flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUp className="size-4" aria-hidden="true" />
                Move up<span className="sr-only"> act {index + 1}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-4" aria-hidden="true" />
                Move down<span className="sr-only"> act {index + 1}</span>
              </Button>
              <Button type="button" variant="ghost" onClick={() => onChange(value.filter((_, at) => at !== index))}>
                <Trash2 className="size-4" aria-hidden="true" />
                Remove<span className="sr-only"> act {index + 1}</span>
              </Button>
            </div>
          </fieldset>
        );
      })}
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        onClick={() => onChange([...value, { role: value.length ? 'opening' : 'headliner', artist: '' }])}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add act
      </Button>
    </FieldSet>
  );
}

// A linked Release belongs only to a Headliner with an Artist; drop it when the row stops being one.
function clean(entry: LineupEntry): LineupEntry {
  const next = { ...entry };
  if (next.role !== 'headliner' || next.artist === undefined) delete next.release;
  if (next.artist === undefined) delete next.artist;
  if (next.name === undefined) delete next.name;
  if (next.release === undefined) delete next.release;
  return next;
}
