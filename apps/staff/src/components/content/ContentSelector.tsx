import { useState } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '../ui/command';
import type { EditorialRecord } from '../../lib/backend/editorial-api';

export default function ContentSelector({
  title,
  section,
  items,
  selected,
  query,
  disabled,
  more,
  onQuery,
  onSearch,
  onMore,
  onSelect,
}: {
  title: string;
  section: string;
  items: EditorialRecord[];
  selected: string;
  query: string;
  disabled: boolean;
  more: boolean;
  onQuery(value: string): void;
  onSearch(): void;
  onMore(): void;
  onSelect(item: EditorialRecord): Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-w-0 flex-1 justify-between"
          disabled={disabled}
          aria-label={`Choose from ${section}`}
        >
          <span className="truncate">{title}</span>
          <ChevronsUpDown className="size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={8}
        collisionPadding={8}
        className="cms-surface cms-content-selector w-[min(24rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] p-0"
      >
        <Command shouldFilter={false} className="cms-content-selector-command h-auto min-h-0 rounded-md">
          <div className="cms-content-selector-search">
            <CommandInput
              wrapperClassName="h-11 min-w-0 flex-1 border-b-0 px-1"
              aria-label={`Search ${section.toLowerCase()}`}
              placeholder={`Search ${section.toLowerCase()}…`}
              value={query}
              onValueChange={onQuery}
              onKeyDownCapture={(event) => {
                if (event.key === 'Enter' && !items.length) {
                  event.preventDefault();
                  if (!disabled) onSearch();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled}
              onClick={onSearch}
              onKeyDown={(event) => event.stopPropagation()}
            >
              Search
            </Button>
          </div>
          <CommandList className="cms-content-selector-list max-h-72 min-h-0 p-1">
            <CommandEmpty>{disabled ? 'Loading content…' : 'No matching content. Try another search.'}</CommandEmpty>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                disabled={disabled}
                onSelect={() => {
                  void onSelect(item).then(() => setOpen(false));
                }}
              >
                <span className="flex-1 break-words">{String(item.data.title ?? item.data.label_name ?? section)}</span>
                {item.id === selected && <Check className="size-4" />}
              </CommandItem>
            ))}
          </CommandList>
          {more && (
            <div className="cms-content-selector-footer">
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={disabled}
                onClick={onMore}
                onKeyDown={(event) => event.stopPropagation()}
              >
                Show more
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
