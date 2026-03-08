import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';

import { createArtistRosterSearcher } from '@/components/artists/artist-roster-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ArtistRosterFiltersProps = {
  pageKey: string;
};

type ArtistRosterDomItem = {
  element: HTMLElement;
  title: string;
};

function ArtistsRosterFilters({ pageKey }: ArtistRosterFiltersProps) {
  const itemsRef = useRef<ArtistRosterDomItem[]>([]);
  const searcherRef = useRef<ReturnType<typeof createArtistRosterSearcher<ArtistRosterDomItem>> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const hasActiveFilters = searchQuery.trim().length > 0;

  const visibleLabel = useMemo(() => {
    return `${visibleCount} ${visibleCount === 1 ? 'artist' : 'artists'}`;
  }, [visibleCount]);

  function applyFilters(nextSearchQuery: string, domItems: ArtistRosterDomItem[]) {
    const matchedElements = nextSearchQuery.trim()
      ? new Set(
          (searcherRef.current?.search(nextSearchQuery) || []).map((match) => match.element),
        )
      : null;

    let nextVisibleCount = 0;

    domItems.forEach((item) => {
      const shouldShow = matchedElements ? matchedElements.has(item.element) : true;

      item.element.hidden = !shouldShow;
      item.element.dataset.filterState = shouldShow ? 'visible' : 'hidden';

      if (shouldShow) {
        nextVisibleCount += 1;
      }
    });

    setVisibleCount(nextVisibleCount);
  }

  useEffect(() => {
    const rosterRoot = document.querySelector<HTMLElement>('[data-artists-roster-root]');
    const domItems = rosterRoot
      ? [...rosterRoot.querySelectorAll<HTMLElement>('[data-artist-roster-item]')].map((element) => ({
          element,
          title: element.dataset.artistTitle || '',
        }))
      : [];

    itemsRef.current = domItems;
    searcherRef.current = createArtistRosterSearcher(domItems);
    setSearchQuery('');
    setTotalCount(domItems.length);
    applyFilters('', domItems);

    return () => {
      domItems.forEach((item) => {
        item.element.hidden = false;
        item.element.dataset.filterState = 'visible';
      });
      searcherRef.current = null;
    };
  }, [pageKey]);

  useEffect(() => {
    applyFilters(searchQuery, itemsRef.current);
  }, [searchQuery]);

  return (
    <div className="artists-roster-filters-panel space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search artists, bios, or releases"
          className="artists-roster-filters-panel__input h-11 rounded-none border-[#2b2b2b] bg-[#111111] pr-3 pl-10 text-[0.95rem]"
          aria-label="Search artists"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tracking-[0.18em] uppercase text-muted-foreground">{visibleLabel}</p>
        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-none px-2 text-[11px] tracking-[0.16em] uppercase text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => {
              setSearchQuery('');
            }}
          >
            Clear search
          </Button>
        ) : (
          <p className="text-xs tracking-[0.14em] uppercase text-[#8f8f8f]">{totalCount} total</p>
        )}
      </div>

      {visibleCount === 0 ? (
        <div className="artists-roster-empty-state rounded-none border border-[#2b2b2b] bg-[#141414] px-5 py-6">
          <p className="text-sm tracking-[0.04em] text-muted-foreground">No artists match the current filters.</p>
        </div>
      ) : null}
    </div>
  );
}

export default ArtistsRosterFilters;
