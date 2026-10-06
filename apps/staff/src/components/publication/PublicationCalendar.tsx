import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { readPublicationCalendar, type ContentPublication } from '../../lib/backend/content-publication-api';
import { contentSections } from '../../lib/content-sections';
import { writeStaffLocation } from '../../lib/staff-navigation';
import { acquireLenisModalLock } from '../../lib/lenis-scroll';
import { publicationHistoryTitle } from './PublicationHistory';
import PublicationDetails from './PublicationDetails';

export function publicationDay(value: number) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Athens',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const part = (name: string) => parts.find((item) => item.type === name)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
const validMonth = (value: string) => /^\d{4}-(?:0[1-9]|1[0-2])$/.test(value);

export default function PublicationCalendar({ base }: { base: string }) {
  const [month, setMonth] = useState(publicationDay(Date.now()).slice(0, 7));
  const [collection, setCollection] = useState('');
  const [view, setView] = useState<'month' | 'agenda'>('month');
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ContentPublication[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<ContentPublication | null>(null);
  const detailRoot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(location.search);
      if (validMonth(params.get('month') ?? '')) setMonth(params.get('month')!);
      setCollection(Object.hasOwn(contentSections, params.get('collection') ?? '') ? params.get('collection')! : '');
      setView(
        params.get('view') === 'agenda' || (params.get('view') !== 'month' && matchMedia('(max-width: 767px)').matches)
          ? 'agenda'
          : 'month',
      );
    };
    restore();
    setReady(true);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const url = new URL(location.href);
    url.searchParams.set('month', month);
    url.searchParams.set('view', view);
    if (collection) url.searchParams.set('collection', collection);
    else url.searchParams.delete('collection');
    writeStaffLocation(url.pathname + url.search);
  }, [ready, month, collection, view]);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setItems([]);
    setError('');
    setBusy(true);
    setSelected(null);
    void (async () => {
      let cursor: string | undefined;
      const seen = new Set<string>();
      do {
        const params = new URLSearchParams({ month });
        if (collection) params.set('collection', collection);
        if (cursor) params.set('cursor', cursor);
        const page = await readPublicationCalendar(base, params, controller.signal);
        if (controller.signal.aborted) return;
        setItems((previous) => [
          ...previous,
          ...page.items.filter((item) => !previous.some((row) => row.id === item.id)),
        ]);
        cursor = page.nextCursor;
        if (cursor && seen.has(cursor)) throw new Error('Calendar pagination could not finish. Retry.');
        if (cursor) seen.add(cursor);
      } while (cursor);
    })()
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Calendar unavailable.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [base, ready, month, collection, retry]);
  useEffect(() => {
    if (selected && detailRoot.current) return acquireLenisModalLock(detailRoot.current);
    return undefined;
  }, [selected]);
  const byDay = new Map<string, ContentPublication[]>();
  for (const item of items) {
    const day = publicationDay(item.completedAt ?? item.requestedAt);
    byDay.set(day, [...(byDay.get(day) ?? []), item]);
  }
  const first = new Date(`${month}-01T12:00:00Z`);
  const last = new Date(first);
  last.setUTCMonth(last.getUTCMonth() + 1);
  last.setUTCDate(0);
  const offset = (first.getUTCDay() + 6) % 7;
  const days = Array.from({ length: last.getUTCDate() }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  const monthLabel = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Athens',
  }).format(first);
  function moveMonth(delta: number) {
    const date = new Date(first);
    date.setUTCMonth(date.getUTCMonth() + delta);
    setMonth(date.toISOString().slice(0, 7));
  }
  function event(item: ContentPublication) {
    return (
      <button type="button" className="publication-calendar-event" key={item.id} onClick={() => setSelected(item)}>
        <strong>{publicationHistoryTitle(item)}</strong>
        <small>
          {item.action === 'withdraw' ? 'Removed' : 'Published'} ·{' '}
          {new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Athens', timeStyle: 'short' }).format(
            item.completedAt ?? item.requestedAt,
          )}
        </small>
        {item.completedAt === undefined && <small>Requested time · completion unavailable</small>}
      </button>
    );
  }
  return (
    <section className="staff-workspace publication-calendar p-4 sm:p-6" aria-label="Publication calendar">
      <h1 className="text-2xl font-semibold">Publication calendar</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Successful website updates in Athens time. Repeated updates and removals are retained.
      </p>
      <div className="my-5 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" aria-label="Previous month" onClick={() => moveMonth(-1)}>
            <ChevronLeft />
          </Button>
          <label className="grid gap-1 text-sm">
            Month
            <Input
              type="month"
              value={month}
              onChange={(e) => {
                if (validMonth(e.target.value)) setMonth(e.target.value);
              }}
            />
          </label>
          <Button variant="outline" aria-label="Next month" onClick={() => moveMonth(1)}>
            <ChevronRight />
          </Button>
        </div>
        <label className="grid gap-1 text-sm">
          Collection
          <select
            className="min-h-11 rounded-md border border-input bg-background px-3"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          >
            <option value="">All collections</option>
            {Object.entries(contentSections).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          View
          <select
            className="min-h-11 rounded-md border border-input bg-background px-3"
            value={view}
            onChange={(e) => setView(e.target.value as 'month' | 'agenda')}
          >
            <option value="month">Month</option>
            <option value="agenda">Agenda</option>
          </select>
        </label>
      </div>
      <h2 className="mb-3 text-lg font-semibold">{monthLabel}</h2>
      {busy && <p role="status">Loading all updates for this month…</p>}
      {error && (
        <div role="alert" className="my-3">
          <p>{error} These results may be incomplete.</p>
          <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
            Retry calendar
          </Button>
        </div>
      )}
      {!busy && !error && !items.length && <p>No successful publications this month.</p>}
      {view === 'month' ? (
        <div className="publication-calendar-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div className="publication-calendar-weekday" key={day}>
              {day}
            </div>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <div aria-hidden="true" key={`empty-${i}`} />
          ))}
          {days.map((day, i) => (
            <section className="publication-calendar-day" key={day} aria-label={day}>
              <h3>
                <time dateTime={day}>{i + 1}</time>
              </h3>
              <div className="publication-calendar-day-events" data-lenis-scroll-root>
                {byDay.get(day)?.map(event)}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <ol className="publication-calendar-agenda">
          {[...byDay]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, updates]) => (
              <li key={day}>
                <h3 className="mb-2 font-semibold">
                  <time dateTime={day}>
                    {new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Athens', dateStyle: 'full' }).format(
                      new Date(`${day}T09:00:00Z`),
                    )}
                  </time>
                </h3>
                <div className="grid gap-2">{updates.map(event)}</div>
              </li>
            ))}
        </ol>
      )}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent ref={detailRoot} className="cms-surface publication-history-sheet" data-lenis-scroll-root>
          <SheetHeader>
            <SheetTitle>{selected ? publicationHistoryTitle(selected) : 'Publication details'}</SheetTitle>
            <SheetDescription>Accepted update details. Times are shown in Athens time.</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="publication-history-content">
              <PublicationDetails base={base} item={selected} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
