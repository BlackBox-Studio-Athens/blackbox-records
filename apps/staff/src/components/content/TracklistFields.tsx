import { TRACK_SIDE_LABELS, type Track, type Tracklist } from '@blackbox/content-model';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { NativeSelect } from '../ui/native-select';
import { Field, FieldLabel, FieldDescription, FieldError, FieldSet, FieldLegend } from '../ui/field';

export default function TracklistFields({
  value,
  onChange,
  formatHint,
  errors = [],
  disabled = false,
}: {
  value: Tracklist | null;
  onChange(value: Tracklist | null): void;
  formatHint: Tracklist['format'] | null;
  errors?: string[];
  disabled?: boolean;
}) {
  const groups = value ? (value.format === 'cd' ? value.discs : value.sides) : [];
  function changeTracks(groupIndex: number, update: (tracks: Track[]) => Track[]) {
    if (!value) return;
    const next = structuredClone(value);
    const target = next.format === 'cd' ? next.discs : next.sides;
    target[groupIndex]!.tracks = update(target[groupIndex]!.tracks);
    onChange(next);
  }
  function changeFormat(format: Tracklist['format']) {
    const tracks = groups.flatMap((group) => group.tracks);
    onChange(format === 'cd' ? { format, discs: [{ tracks }] } : { format, sides: [{ label: 'A', tracks }] });
  }
  function moveGroup(index: number, delta: number) {
    if (!value) return;
    const next = structuredClone(value);
    const target = next.format === 'cd' ? next.discs : next.sides;
    [target[index], target[index + delta]] = [target[index + delta]!, target[index]!];
    onChange(next);
  }
  return (
    <FieldSet
      disabled={disabled}
      className="col-span-full min-w-0 gap-4"
      data-content-path="tracklist"
      data-invalid={errors.length > 0}
    >
      <FieldLegend>Tracklist</FieldLegend>
      <FieldDescription>
        Optional. Enter only tracks from this physical edition. Empty tracklists stay off the website.
      </FieldDescription>
      <FieldError>{errors.join(' ')}</FieldError>
      {!value ? (
        <Button type="button" variant="outline" onClick={() => changeFormat(formatHint || 'vinyl')}>
          Add tracklist
        </Button>
      ) : (
        <>
          <Field>
            <FieldLabel htmlFor="tracklist-format">Tracklist format</FieldLabel>
            <NativeSelect
              id="tracklist-format"
              value={value.format}
              onChange={(event) => changeFormat(event.target.value as Tracklist['format'])}
            >
              <option value="vinyl">Vinyl</option>
              <option value="cassette">Cassette</option>
              <option value="cd">CD</option>
            </NativeSelect>
            <FieldDescription>
              Changing format keeps all tracks in the first side or disc. Review the order and side boundaries for that
              edition.
            </FieldDescription>
            {formatHint && formatHint !== value.format && (
              <FieldDescription>
                This tracklist will not appear on the current {formatHint === 'cd' ? 'CD' : formatHint} Store Item.
              </FieldDescription>
            )}
          </Field>
          {groups.map((group, groupIndex) => (
            <FieldSet key={groupIndex} className="min-w-0 border-t border-border pt-4">
              <FieldLegend>
                {value.format === 'cd' ? `Disc ${groupIndex + 1}` : `Side ${value.sides[groupIndex]!.label}`}
              </FieldLegend>
              {value.format !== 'cd' && (
                <Field>
                  <FieldLabel htmlFor={`tracklist-side-${groupIndex}`}>Side letter</FieldLabel>
                  <NativeSelect
                    id={`tracklist-side-${groupIndex}`}
                    value={value.sides[groupIndex]!.label}
                    onChange={(event) => {
                      const next = structuredClone(value);
                      next.sides[groupIndex]!.label = event.target.value;
                      onChange(next);
                    }}
                  >
                    {TRACK_SIDE_LABELS.map((label) => (
                      <option key={label}>{label}</option>
                    ))}
                  </NativeSelect>
                </Field>
              )}
              {group.tracks.map((track, trackIndex) => (
                <div
                  key={trackIndex}
                  className="grid min-w-0 gap-3 border-t border-border py-3 sm:grid-cols-[minmax(0,1fr)_8rem]"
                >
                  <Field>
                    <FieldLabel htmlFor={`track-${groupIndex}-${trackIndex}`}>Track {trackIndex + 1} title</FieldLabel>
                    <Input
                      id={`track-${groupIndex}-${trackIndex}`}
                      value={track.title}
                      maxLength={300}
                      onChange={(event) =>
                        changeTracks(groupIndex, (tracks) =>
                          tracks.map((current, index) =>
                            index === trackIndex ? { ...current, title: event.target.value } : current,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`duration-${groupIndex}-${trackIndex}`}>Duration</FieldLabel>
                    <Input
                      id={`duration-${groupIndex}-${trackIndex}`}
                      value={track.duration || ''}
                      placeholder="3:42"
                      aria-describedby={`duration-help-${groupIndex}-${trackIndex}`}
                      onChange={(event) =>
                        changeTracks(groupIndex, (tracks) =>
                          tracks.map((current, index) => {
                            if (index !== trackIndex) return current;
                            const { duration: _duration, ...rest } = current;
                            return event.target.value ? { ...rest, duration: event.target.value } : rest;
                          }),
                        )
                      }
                    />
                    <FieldDescription id={`duration-help-${groupIndex}-${trackIndex}`}>Optional m:ss</FieldDescription>
                  </Field>
                  <div className="flex flex-wrap gap-2 sm:col-span-full">
                    {[-1, 1].map((delta) => (
                      <Button
                        type="button"
                        variant="outline"
                        key={delta}
                        disabled={trackIndex + delta < 0 || trackIndex + delta >= group.tracks.length}
                        aria-label={`Move track ${trackIndex + 1} ${delta < 0 ? 'up' : 'down'}`}
                        onClick={() =>
                          changeTracks(groupIndex, (tracks) => {
                            const next = [...tracks];
                            [next[trackIndex], next[trackIndex + delta]] = [
                              next[trackIndex + delta]!,
                              next[trackIndex]!,
                            ];
                            return next;
                          })
                        }
                      >
                        {delta < 0 ? 'Move up' : 'Move down'}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        changeTracks(groupIndex, (tracks) => tracks.filter((_, index) => index !== trackIndex))
                      }
                    >
                      Remove track {trackIndex + 1}
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={group.tracks.length >= 99}
                  onClick={() => changeTracks(groupIndex, (tracks) => [...tracks, { title: '' }])}
                >
                  Add track
                </Button>
                {[-1, 1].map((delta) => (
                  <Button
                    type="button"
                    variant="outline"
                    key={delta}
                    disabled={groupIndex + delta < 0 || groupIndex + delta >= groups.length}
                    onClick={() => moveGroup(groupIndex, delta)}
                  >
                    Move {value.format === 'cd' ? 'disc' : 'side'} {delta < 0 ? 'up' : 'down'}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onChange(
                      value.format === 'cd'
                        ? { ...value, discs: value.discs.filter((_, index) => index !== groupIndex) }
                        : { ...value, sides: value.sides.filter((_, index) => index !== groupIndex) },
                    )
                  }
                >
                  Remove {value.format === 'cd' ? 'disc' : 'side'}
                </Button>
              </div>
            </FieldSet>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={groups.length >= 26}
              onClick={() =>
                onChange(
                  value.format === 'cd'
                    ? { ...value, discs: [...value.discs, { tracks: [] }] }
                    : {
                        ...value,
                        sides: [
                          ...value.sides,
                          {
                            label: TRACK_SIDE_LABELS.find(
                              (label) => !value.sides.some((side) => side.label === label),
                            )!,
                            tracks: [],
                          },
                        ],
                      },
                )
              }
            >
              Add {value.format === 'cd' ? 'disc' : 'side'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onChange(null)}>
              Remove tracklist
            </Button>
          </div>
        </>
      )}
    </FieldSet>
  );
}
