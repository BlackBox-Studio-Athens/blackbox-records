import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';

import {
  createArtistRosterSearcher,
  filterArtistRoster,
  listArtistRosterGenres,
  sortArtistRoster,
  type ArtistRosterSort,
} from './artist-roster-search';
import { artistRosterVisibleEvent, type ArtistRosterVisibleDetail } from './artist-roster-preview-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ArtistRosterFiltersProps = {
  pageKey: string;
};

type ArtistRosterDomItem = {
  element: HTMLElement;
  genre: string;
  id: string;
  latestReleaseSort: string;
  sortName: string;
  title: string;
};

const sortOptions: { label: string; value: ArtistRosterSort }[] = [
  { label: 'A–Z', value: 'az' },
  { label: 'Latest release', value: 'latest' },
];

const controlClassName =
  'inline-flex min-h-11 items-center justify-center rounded-none border px-3 text-[11px] tracking-[0.16em] uppercase lg:min-h-9';

function readRosterRoot() {
  return document.querySelector<HTMLElement>('[data-artists-roster-root]');
}

function readRosterItems(root: HTMLElement): ArtistRosterDomItem[] {
  return [...root.querySelectorAll<HTMLElement>('[data-artist-roster-item]')].map((element) => ({
    element,
    genre: element.dataset.artistGenre || '',
    id: element.dataset.artistId || '',
    latestReleaseSort: element.dataset.artistLatestReleaseSort || '',
    sortName: element.dataset.artistSortName || element.dataset.artistTitle || '',
    title: element.dataset.artistTitle || '',
  }));
}

function ArtistsRosterFilters({ pageKey }: ArtistRosterFiltersProps) {
  const [items, setItems] = useState<ArtistRosterDomItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState<ArtistRosterSort>('az');
  const [visibleCount, setVisibleCount] = useState(0);

  const searcher = useMemo(() => createArtistRosterSearcher(items), [items]);
  const genres = useMemo(() => listArtistRosterGenres(items), [items]);
  const totalCount = items.length;
  const hasActiveFilters = searchQuery.trim().length > 0 || genre !== '';
  const visibleLabel = `${visibleCount} ${visibleCount === 1 ? 'artist' : 'artists'}`;

  useEffect(() => {
    const rosterRoot = readRosterRoot();
    const domItems = rosterRoot ? readRosterItems(rosterRoot) : [];
    setItems(domItems);

    return () => {
      domItems.forEach((item) => {
        item.element.hidden = false;
        item.element.dataset.filterState = 'visible';
        item.element.style.removeProperty('order');
      });
      rosterRoot?.removeAttribute('data-roster-sort');
    };
  }, [pageKey]);

  useEffect(() => {
    const visible = new Set(filterArtistRoster(items, { genre, query: searchQuery }, searcher));

    items.forEach((item) => {
      const shouldShow = visible.has(item);
      item.element.hidden = !shouldShow;
      item.element.dataset.filterState = shouldShow ? 'visible' : 'hidden';
    });

    // CSS `order` keeps server DOM order (and shell snapshots) intact; A-Z needs no order at all.
    const ordered = sortArtistRoster(items, sort);
    ordered.forEach((item, index) => {
      if (sort === 'latest') item.element.style.order = String(index);
      else item.element.style.removeProperty('order');
    });

    const rosterRoot = readRosterRoot();
    if (sort === 'latest') rosterRoot?.setAttribute('data-roster-sort', 'latest');
    else rosterRoot?.removeAttribute('data-roster-sort');

    setVisibleCount(visible.size);
    // The preview island follows this to drop an active artist that is no longer listed.
    rosterRoot?.dispatchEvent(
      new CustomEvent<ArtistRosterVisibleDetail>(artistRosterVisibleEvent, {
        detail: { visibleIds: ordered.filter((item) => visible.has(item)).map((item) => item.id) },
      }),
    );
  }, [items, searchQuery, genre, sort, searcher]);

  function clearFilters() {
    setSearchQuery('');
    setGenre('');
  }

  return (
    <div className="artists-roster-filters-panel space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search artists"
          className="artists-roster-filters-panel__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] pr-3 pl-10 text-[0.95rem]"
          aria-label="Search artists"
        />
      </div>

      {genres.length > 1 ? (
        <div
          role="group"
          aria-label="Filter by genre"
          className="-mx-1.5 -mt-1.5 flex gap-2 overflow-x-auto px-1.5 py-1.5 lg:flex-wrap lg:overflow-visible"
        >
          {[{ genre: '', count: totalCount }, ...genres].map((option) => {
            const pressed = option.genre === genre;
            return (
              <Button
                key={option.genre || 'all'}
                type="button"
                variant="chip"
                size="sm"
                aria-pressed={pressed}
                onClick={() => setGenre(option.genre)}
              >
                {pressed ? <Check className="size-3" aria-hidden="true" /> : null}
                <span>{option.genre || 'All'}</span>
                <span>{option.count}</span>
              </Button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-[11px] tracking-[0.18em] uppercase text-[#8f8f8f]">Sort</span>
          <div role="group" aria-label="Sort artists" className="hidden lg:flex">
            {sortOptions.map((option) => {
              const pressed = option.value === sort;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="chip"
                  size="sm"
                  aria-pressed={pressed}
                  className="-ml-px first:ml-0 aria-pressed:z-10"
                  onClick={() => setSort(option.value)}
                >
                  {pressed ? <Check className="size-3" aria-hidden="true" /> : null}
                  {option.label}
                </Button>
              );
            })}
          </div>
          <select
            aria-label="Sort artists"
            value={sort}
            onChange={(event) => setSort(event.target.value as ArtistRosterSort)}
            className={`${controlClassName} border-[#2b2b2b] bg-[#111111] text-[#f5f5f5] lg:hidden`}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground">{visibleLabel}</p>
          {hasActiveFilters ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              {genre === '' ? 'Clear search' : 'Clear filters'}
            </Button>
          ) : (
            <p className="text-xs tracking-[0.14em] uppercase text-[#8f8f8f]">{totalCount} total</p>
          )}
        </div>
      </div>

      {totalCount > 0 && visibleCount === 0 ? (
        <div className="artists-roster-empty-state rounded-none border border-[#2b2b2b] bg-[#141414] px-5 py-6">
          <p className="text-sm tracking-[0.04em] text-muted-foreground">No artists match the current filters.</p>
        </div>
      ) : null}
    </div>
  );
}

export default ArtistsRosterFilters;
