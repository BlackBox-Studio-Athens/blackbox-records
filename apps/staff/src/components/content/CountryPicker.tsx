import { useId, useState } from 'react';
import { countryOptions, formatArtistCountries, parseArtistCountries } from '@blackbox/content-model';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '../ui/command';
import { Field, FieldLabel, FieldDescription, FieldError } from '../ui/field';

export default function CountryPicker({
  value,
  onChange,
  error,
  single = false,
  path = 'country',
}: {
  value: string;
  onChange(value: string): void;
  error?: string | undefined;
  single?: boolean;
  path?: string;
}) {
  const id = useId();
  const label = single ? 'Country' : 'Countries';
  const [open, setOpen] = useState(false);
  const selected = parseArtistCountries(value);
  const unrecognized = selected === null || (single && selected.length > 1);
  return (
    <Field data-invalid={!!error || unrecognized}>
      <FieldLabel htmlFor={id} required={single}>
        {label}
      </FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            aria-describedby={`${id}-help`}
            className="h-auto min-h-11 w-full justify-between whitespace-normal"
            data-content-path={path}
          >
            <span>{value || (single ? 'Choose a country' : 'Choose countries')}</span>
            <ChevronsUpDown className="size-4 shrink-0" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="cms-surface w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search countries…" aria-label="Search countries" />
            <CommandList>
              <CommandEmpty>No countries found.</CommandEmpty>
              {countryOptions.map(({ code, name }) => (
                <CommandItem
                  key={code}
                  value={`${name} ${code}`}
                  onSelect={() => {
                    if (single) {
                      onChange(formatArtistCountries([code]));
                      setOpen(false);
                      return;
                    }
                    onChange(
                      formatArtistCountries(
                        selected?.includes(code)
                          ? selected.filter((item) => item !== code)
                          : [...(selected ?? []), code],
                      ),
                    );
                  }}
                >
                  <Check
                    className={`size-4 ${selected?.includes(code) ? 'opacity-100' : 'opacity-0'}`}
                    aria-hidden="true"
                  />
                  {name}
                  {selected?.includes(code) && <span className="sr-only"> selected</span>}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FieldDescription id={`${id}-help`}>
        {single ? 'Search and choose one country.' : 'Optional. Select one or more countries. Select again to remove.'}
      </FieldDescription>
      <FieldError>
        {error || (unrecognized ? 'Choose from the list to replace this unrecognized value.' : '')}
      </FieldError>
    </Field>
  );
}
