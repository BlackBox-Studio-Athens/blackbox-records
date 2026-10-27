import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Boxes, FileText, Plus, RefreshCw } from 'lucide-react';
import { editorialRequest, type EditorialList, type EditorialRecord } from '../lib/backend/editorial-api';
import { readContentPublications } from '../lib/backend/content-publication-api';
import { createInternalAnalyticsApi, type StaffStatsReport } from '../lib/backend/internal-analytics-api';
import { writeStaffLocation } from '../lib/staff-navigation';
import { readStaffQuery, useStaffRead } from '../lib/staff-query';
import { contentSections, type ContentSection } from '../lib/content-sections';
import { Button } from './ui/button';
import {
  figureChange,
  formatFigure,
  formatReadTime,
  leadSentence,
  overviewFigures,
  overviewRanges,
  parseOverviewRange,
  overviewLocation,
  periodSentence,
  shortDate,
  type Figure,
  type OverviewRange,
} from './stats/stats-overview';
import { countLabel, orderTodos, paidAge, type OrderTodos } from './orders/order-todos';
import { changesTodo } from '../lib/unpublished-changes';

type Panel<T> = { status: 'loading' | 'ready' | 'error'; data: T | null; error: string; hasLoaded: boolean };
type StatsSource = 'visits' | 'store' | 'search';
const statsSources: StatsSource[] = ['visits', 'store', 'search'];
const sourceNames: Record<StatsSource, string> = { visits: 'Visits', store: 'Store', search: 'Google Search' };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/** One independent read: its own loading, error and retry; superseded responses never replace newer ones. */
function usePanel<T>(key: readonly unknown[], read: () => Promise<T>, fallback: string) {
  const [panel, setPanel] = useState<Panel<T>>({ status: 'loading', data: null, error: '', hasLoaded: false });
  const request = useRef(0);
  const serialized = JSON.stringify(key);
  const load = async () => {
    const id = ++request.current;
    setPanel((state) => ({ ...state, status: 'loading', error: '' }));
    try {
      const data = await readStaffQuery(JSON.parse(serialized) as unknown[], read);
      if (request.current === id) setPanel({ status: 'ready', data, error: '', hasLoaded: true });
    } catch (error) {
      if (request.current === id)
        setPanel((state) => ({ ...state, status: 'error', error: errorMessage(error, fallback) }));
    }
  };
  useEffect(() => {
    setPanel({ status: 'loading', data: null, error: '', hasLoaded: false });
    void load();
    return () => {
      request.current++;
    };
  }, [serialized]);
  return { panel, load };
}

function draftTitle(draft: EditorialRecord) {
  return String(
    draft.data.title || draft.data.label_name || contentSections[draft.collection as ContentSection] || 'Untitled',
  );
}

export default function StaffOverview({ base }: { base: string }) {
  const [range, setRange] = useState<OverviewRange>('7d');
  useEffect(() => {
    const follow = () => setRange(parseOverviewRange(window.location.search));
    follow();
    window.addEventListener('popstate', follow);
    return () => window.removeEventListener('popstate', follow);
  }, []);
  const analytics = useRef(createInternalAnalyticsApi({ backendBaseUrl: base })).current;
  const readSource = (source: StatsSource) => () =>
    analytics.readStatsReport({ source, range, compare: 'true' }) as Promise<StaffStatsReport>;
  const stats = {
    visits: usePanel(['overview-stats', base, 'visits', range], readSource('visits'), 'Visits unavailable.'),
    store: usePanel(['overview-stats', base, 'store', range], readSource('store'), 'Store figures unavailable.'),
    search: usePanel(['overview-stats', base, 'search', range], readSource('search'), 'Search figures unavailable.'),
  };
  const toShip = usePanel(
    ['overview-orders-to-ship', base],
    async () => {
      const { createInternalOrderApi } = await import('./orders/internal-order-api');
      const page = await createInternalOrderApi(base).search({ status: 'paid', dispatch: 'not_shipped', limit: 50 });
      return orderTodos(page.items, page.nextCursor);
    },
    'Orders to ship unavailable.',
  );
  const review = usePanel(
    ['overview-orders-review', base],
    async () => {
      const { createInternalOrderApi } = await import('./orders/internal-order-api');
      return (await createInternalOrderApi(base).search({ status: 'needs_review', limit: 1 })).items.length > 0;
    },
    'Order review status unavailable.',
  );
  const drafts = usePanel(
    ['overview-drafts', base],
    async () =>
      (await editorialRequest<EditorialList<EditorialRecord>>(base, 'blackbox/workspace?view=overview')).items,
    'Recent drafts unavailable.',
  );
  const publications = usePanel(
    ['overview-publications', base],
    async () => (await readContentPublications(base)).items[0]?.status === 'failed',
    'Publication status unavailable.',
  );
  useStaffRead(['overview', base, range], () =>
    Promise.all([
      ...statsSources.map((source) => stats[source].load()),
      toShip.load(),
      review.load(),
      drafts.load(),
      publications.load(),
    ]),
  );

  const reports = Object.fromEntries(statsSources.map((source) => [source, stats[source].panel.data]));
  const figures = overviewFigures(reports, range);
  const lead = leadSentence(figures, range);
  const readTimes = statsSources
    .map((source) => stats[source].panel.data?.generatedAt)
    .filter((value): value is string => !!value)
    .sort();
  const search = stats.search.panel.data;
  const changeRange = (next: OverviewRange) => {
    setRange(next);
    writeStaffLocation(overviewLocation(next), { push: true });
  };

  return (
    <div className="staff-page staff-overview">
      <div className="overview-heading">
        <div>
          <h1>Overview</h1>
          <p className="overview-period">{periodSentence(range)}</p>
        </div>
        <div className="overview-ranges" role="group" aria-label="Period">
          {overviewRanges.map(([key, label]) => (
            <button key={key} type="button" aria-pressed={range === key} onClick={() => changeRange(key)}>
              {label}
            </button>
          ))}
          <a href={`/stats/?range=${range}&compare=true`}>More</a>
        </div>
      </div>

      {lead && <p className="overview-lead">{lead}</p>}
      <div className="overview-figures">
        {figures.map((figure) => (
          <FigureRow key={figure.key} figure={figure} panel={stats[figure.source].panel} />
        ))}
      </div>
      {statsSources
        .filter((source) => stats[source].panel.status === 'error')
        .map((source) => (
          <div key={source} className="overview-alert" role="alert">
            <p>
              {sourceNames[source]}: {stats[source].panel.error}
            </p>
            <Button variant="outline" onClick={() => void stats[source].load()}>
              <RefreshCw aria-hidden="true" />
              Retry {sourceNames[source]}
            </Button>
          </div>
        ))}
      {readTimes.length > 0 && (
        <p className="overview-fresh">
          Read {formatReadTime(readTimes.at(-1)!)}. Visits and Store use UTC days.
          {search?.status === 'ok' && search.latestDate ? ` Google data runs to ${shortDate(search.latestDate)}.` : ''}
        </p>
      )}

      <section className="overview-todo" aria-labelledby="overview-todo-heading">
        <h2 id="overview-todo-heading">To do</h2>
        <TodoList
          toShip={toShip.panel}
          review={review.panel}
          drafts={drafts.panel}
          publicationFailed={publications.panel.data === true}
        />
        {[
          [toShip, 'orders to ship'],
          [review, 'order review'],
          [drafts, 'saved changes'],
          [publications, 'publication status'],
        ].map(([read, name]) => {
          const { panel, load } = read as typeof toShip;
          return (
            panel.status === 'error' && (
              <div key={name as string} className="overview-alert" role="alert">
                <p>{panel.error}</p>
                <Button variant="outline" onClick={() => void load()}>
                  <RefreshCw aria-hidden="true" />
                  Retry {name as string}
                </Button>
              </div>
            )
          );
        })}
      </section>

      <div className="overview-actions">
        <Button asChild variant="outline">
          <a href="/items/">
            <Plus aria-hidden="true" />
            Add to the catalog
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/content/">
            <FileText aria-hidden="true" />
            Edit a page
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/stock/">
            <Boxes aria-hidden="true" />
            Update stock
          </a>
        </Button>
      </div>

      {drafts.panel.hasLoaded && (drafts.panel.data?.length ?? 0) > 0 && (
        <section className="overview-drafts" aria-labelledby="overview-drafts-heading">
          <h2 id="overview-drafts-heading">Recent drafts</h2>
          <div className="staff-destinations">
            {drafts.panel.data!.slice(0, 5).map((draft) => (
              <a
                key={`${draft.collection}:${draft.id}`}
                href={`/content/?${new URLSearchParams({ collection: draft.collection ?? 'artists', id: draft.id })}`}
              >
                <div>
                  <strong>{draftTitle(draft)}</strong>
                  <p>
                    {draft.publicationState === 'pending'
                      ? 'Updating website…'
                      : draft.publicationState === 'changes'
                        ? 'Unpublished changes'
                        : 'Draft'}
                  </p>
                </div>
                <ArrowRight aria-hidden="true" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function FigureRow({ figure, panel }: { figure: Figure; panel: Panel<StaffStatsReport> }) {
  const change = figureChange(figure);
  const notConnected = panel.data?.status === 'not_configured';
  return (
    <a className="overview-figure" href={figure.href} data-source={figure.source}>
      <span className="overview-figure-label">
        <i aria-hidden="true" />
        {figure.label}
      </span>
      {figure.value !== null ? (
        <>
          <strong className="overview-figure-value">{formatFigure(figure)}</strong>
          <span className="overview-figure-change" data-direction={change?.direction ?? 'none'}>
            {change ? (
              <>
                <span aria-hidden="true">
                  {change.direction === 'up' ? '↑' : change.direction === 'down' ? '↓' : '→'}
                </span>
                {change.text}
              </>
            ) : (
              'No comparison'
            )}
          </span>
        </>
      ) : (
        <span className="overview-figure-state">
          {!panel.hasLoaded && panel.status === 'loading'
            ? 'Loading…'
            : panel.status === 'error' && !panel.data
              ? 'Not available'
              : notConnected
                ? 'Not connected'
                : 'No figures yet'}
        </span>
      )}
      <ArrowRight aria-hidden="true" className="overview-figure-arrow" />
    </a>
  );
}

function TodoList({
  toShip,
  review,
  drafts,
  publicationFailed,
}: {
  toShip: Panel<OrderTodos>;
  review: Panel<boolean>;
  drafts: Panel<EditorialRecord[]>;
  publicationFailed: boolean;
}) {
  const orders = toShip.data;
  const changes = drafts.data
    ? changesTodo(drafts.data.map((draft) => ({ ...draft, title: draftTitle(draft) })))
    : null;
  const rows: { href: string; count: string | null; label: string; detail?: string; attention?: boolean }[] = [];
  if (orders?.toShip)
    rows.push({
      href: '/orders/?status=paid&dispatch=not_shipped',
      count: countLabel(orders.toShip, orders.more),
      label: orders.toShip === 1 ? 'Paid order to ship' : 'Paid orders to ship',
      ...(orders.oldestPaidAt ? { detail: `Oldest paid ${paidAge(orders.oldestPaidAt)}` } : {}),
      attention: true,
    });
  if (orders?.waiting)
    rows.push({
      href: '/orders/?status=paid&dispatch=not_shipped&awaitingStock=true',
      count: countLabel(orders.waiting, orders.more),
      label: orders.waiting === 1 ? 'Order waiting for stock' : 'Orders waiting for stock',
      detail: orders.waitingNames.join(' · '),
    });
  if (review.data)
    rows.push({ href: '/orders/?status=needs_review', count: null, label: 'Orders need review', attention: true });
  if (publicationFailed) rows.push({ href: '/content/?history=1', count: null, label: 'Website update not confirmed' });
  if (changes?.count)
    rows.push({
      href: '/review/',
      count: countLabel(changes.count, changes.more),
      label: 'Saved changes not on the website',
      detail: changes.names.join(', '),
    });
  const settled = [toShip, review, drafts].every((panel) => panel.hasLoaded);
  if (!rows.length)
    return (
      <p className="overview-empty" role="status">
        {settled ? 'Nothing waiting.' : 'Checking orders and changes…'}
      </p>
    );
  return (
    <div className="overview-todo-rows">
      {rows.map((row) => (
        <a key={row.href} href={row.href} className="overview-todo-row">
          <span className="overview-count" data-attention={row.attention ? 'true' : undefined} aria-hidden="true">
            {row.count ?? '!'}
          </span>
          <span>
            {row.count && <span className="sr-only">{row.count} </span>}
            <strong>{row.label}</strong>
            {row.detail && <small>{row.detail}</small>}
          </span>
          <ArrowRight aria-hidden="true" />
        </a>
      ))}
    </div>
  );
}
