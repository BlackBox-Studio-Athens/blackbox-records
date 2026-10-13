import { lazy, Suspense, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { LockKeyhole, Minus, RefreshCw, Search, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import {
  createInternalAnalyticsApi,
  type SearchStats,
  type SiteAnalytics,
  type SiteAnalyticsRange,
  type StoreStats,
} from '../../lib/backend/internal-analytics-api';
import { writeStaffLocation } from '../../lib/staff-navigation';
import { useStaffRead } from '../../lib/staff-query';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { createStatsWorkspace, type StatsRead, type StatsState } from './stats-workspace';
import {
  countryLabel,
  formatCount,
  formatDay,
  formatDayTick,
  formatEuro,
  formatPosition,
  formatReadTime,
  plural,
} from './stats-format';
import { byVisits, deviceNames, mergeDevices, mergeSources, pageLabel } from './stats-labels';
import { deviceSentence, rangeWords, storeSentence, summarySentence, type SummaryPart } from './stats-summary';
import { DeviceIcon, PageIcon, SourceIcon } from './StatsIcons';

// Recharts loads only when a chart is drawn, after the page and its states are already usable.
const TrafficChart = lazy(() => import('./StatsCharts').then((module) => ({ default: module.TrafficChart })));
const DevicesChart = lazy(() => import('./StatsCharts').then((module) => ({ default: module.DevicesChart })));

const unavailable = {
  site: 'Analytics is temporarily unavailable. Try again.',
  store: 'Store figures are temporarily unavailable. Try again.',
  search: 'Search figures are temporarily unavailable. Try again.',
};
type Source = keyof typeof unavailable;

const rangeFromUrl = (): SiteAnalyticsRange =>
  new URLSearchParams(window.location.search).get('range') === '30d' ? '30d' : '7d';
const sum = (rows: { visits: number; pageViews: number }[], key: 'visits' | 'pageViews') =>
  rows.reduce((total, row) => total + row[key], 0);

export default function StatsWorkspace({ backendBaseUrl }: { backendBaseUrl: string }) {
  const sources = useMemo(() => {
    const api = createInternalAnalyticsApi({ backendBaseUrl });
    return {
      site: createStatsWorkspace(api.readAnalytics, unavailable.site),
      store: createStatsWorkspace(api.readStoreStats, unavailable.store),
      search: createStatsWorkspace(api.readSearchStats, unavailable.search),
    };
  }, [backendBaseUrl]);
  const site = useSyncExternalStore(sources.site.subscribe, sources.site.getSnapshot, sources.site.getSnapshot);
  const store = useSyncExternalStore(sources.store.subscribe, sources.store.getSnapshot, sources.store.getSnapshot);
  const search = useSyncExternalStore(sources.search.subscribe, sources.search.getSnapshot, sources.search.getSnapshot);
  const denied = site.denied || store.denied || search.denied;

  useEffect(() => {
    const followUrl = () => {
      const range = rangeFromUrl();
      void sources.site.load(range);
      void sources.store.load(range);
      void sources.search.load(range);
    };
    followUrl();
    window.addEventListener('popstate', followUrl);
    return () => window.removeEventListener('popstate', followUrl);
  }, [sources]);
  useStaffRead(['site-analytics', site.range], () => sources.site.load(site.range), { enabled: !denied });
  useStaffRead(['store-stats', site.range], () => sources.store.load(site.range), { enabled: !denied });
  useStaffRead(['search-stats', site.range], () => sources.search.load(site.range), { enabled: !denied });

  return (
    <StatsView
      site={site}
      store={store}
      search={search}
      onRange={(range) => {
        writeStaffLocation(range === '30d' ? '/stats/?range=30d' : '/stats/');
        void sources.site.load(range);
        void sources.store.load(range);
        void sources.search.load(range);
      }}
      onRetry={(source) => void sources[source].load(site.range)}
    />
  );
}

export function StatsView({
  site,
  store,
  search,
  onRange,
  onRetry,
}: {
  site: StatsState<SiteAnalytics>;
  store: StatsState<StoreStats>;
  search: StatsState<SearchStats>;
  onRange: (range: SiteAnalyticsRange) => void;
  onRetry: (source: Source) => void;
}) {
  if (site.denied || store.denied || search.denied)
    return (
      <div className="staff-workspace stats-workspace stats-message">
        <LockKeyhole size={36} aria-hidden="true" />
        <h1>Access required</h1>
        <p>Your staff session may have expired, or this account does not have access.</p>
        <p>Sign in with an allowed staff account and reload to continue.</p>
      </div>
    );

  const range = site.range;
  const read = site.reads[range];
  const data = read.data;
  const report = data?.status === 'ok' ? data : null;
  const stale = !!read.error && !!report;
  const waiting = read.loading && !data;
  return (
    <div className="staff-workspace stats-workspace">
      <header className="stats-heading">
        <h1>Stats</h1>
        <div className="stats-heading-side">
          <div className="stats-range" role="group" aria-label="Range">
            {(['7d', '30d'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={range === option}
                onClick={() => range !== option && onRange(option)}
              >
                {option === '7d' ? '7 days' : '30 days'}
              </button>
            ))}
          </div>
          {data?.generatedAt && !read.error && (
            <span className="stats-muted">Read at {formatReadTime(data.generatedAt)}</span>
          )}
        </div>
      </header>
      {read.error && (
        <div className="stats-error" role="alert">
          <TriangleAlert size={21} aria-hidden="true" />
          <div>
            <strong>{data ? "Couldn't refresh. Showing the last saved figures." : 'Unable to load stats.'}</strong>
            <p>{read.error.message}</p>
            {data?.generatedAt && <p>Last successful read: {formatReadTime(data.generatedAt)}.</p>}
            {read.error.requestId && <p className="stats-muted">Reference: {read.error.requestId}</p>}
            <Button variant="outline" onClick={() => onRetry('site')} disabled={read.loading}>
              <RefreshCw aria-hidden="true" />
              Retry
            </Button>
          </div>
        </div>
      )}
      <div role="status" aria-live="polite" className="stats-load-status">
        {read.loading ? (data ? 'Refreshing stats…' : 'Loading stats…') : ''}
      </div>
      {data?.status === 'not_configured' && (
        <section className="stats-message" aria-labelledby="stats-setup">
          <h2 id="stats-setup">Stats aren't available here yet</h2>
          <p>Visit figures will appear here once they are connected.</p>
        </section>
      )}
      <Summary report={report} store={store.reads[range].data} stale={stale} />
      <div className="stats-columns">
        <div>
          {waiting && <Skeleton tall />}
          {report && <TrafficSection report={report} stale={stale} />}
          <SearchSection read={search.reads[range]} onRetry={() => onRetry('search')} />
          {report && (
            <RankSection
              id="stats-pages"
              title="Top pages"
              label="Page"
              stale={stale}
              total={sum(report.daily, 'visits')}
              rows={byVisits(report.topPaths).map((row) => {
                const page = pageLabel(row.path);
                return {
                  ...row,
                  key: row.path,
                  name: page.name,
                  detail: row.path,
                  icon: <PageIcon kind={page.kind} />,
                };
              })}
            />
          )}
        </div>
        <div className="stats-rail">
          <StoreSection read={store.reads[range]} range={range} onRetry={() => onRetry('store')} />
          {waiting && <Skeleton />}
          {report && <SiteRail report={report} stale={stale} />}
        </div>
      </div>
      {report && (
        <footer className="stats-notes">
          <p>Figures are estimates from Cloudflare; a visit is not a unique person.</p>
          <p>Days run midnight to midnight UTC and include today so far.</p>
        </footer>
      )}
    </div>
  );
}

function Skeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="stats-skeleton" aria-hidden="true">
      <span className={tall ? 'tall' : undefined} />
      <span />
    </div>
  );
}

function Summary({ report, store, stale }: { report: SiteAnalytics | null; store: StoreStats | null; stale: boolean }) {
  const visits = report ? sum(report.daily, 'visits') : null;
  const siteParts: SummaryPart[] = !report
    ? []
    : visits
      ? summarySentence(report)
      : [`No visits recorded in ${rangeWords(report.range)}. Counting starts when the live site is open to visitors.`];
  const storeParts = store ? storeSentence(store.current, visits) : [];
  if (!siteParts.length && !storeParts.length) return null;
  const parts =
    siteParts.length && storeParts.length ? [...siteParts, ' ', ...storeParts] : [...siteParts, ...storeParts];
  return (
    <p className={cn('stats-summary', stale && 'stats-stale')}>
      {parts.map((part, index) => (typeof part === 'string' ? part : <strong key={index}>{part.strong}</strong>))}
    </p>
  );
}

function TrafficSection({ report, stale }: { report: SiteAnalytics; stale: boolean }) {
  if (!sum(report.daily, 'visits')) return null;
  const lastDay = report.daily.at(-1)?.date;
  return (
    <section className={cn('stats-section', stale && 'stats-stale')} aria-labelledby="stats-traffic">
      <h2 id="stats-traffic">Visits per day</h2>
      <Suspense fallback={<div className="stats-chart-placeholder" />}>
        <TrafficChart daily={report.daily} />
      </Suspense>
      <details className="stats-table-view">
        <summary>Show daily figures as a table</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Day (UTC)</th>
              <th scope="col">Visits</th>
              <th scope="col">Page views</th>
            </tr>
          </thead>
          <tbody>
            {report.daily.map((day) => (
              <tr key={day.date}>
                <td>
                  {formatDay(day.date)}
                  {day.date === lastDay ? ' (so far)' : ''}
                </td>
                <td>{formatCount(day.visits)}</td>
                <td>{formatCount(day.pageViews)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function SiteRail({ report, stale }: { report: SiteAnalytics; stale: boolean }) {
  const visits = sum(report.daily, 'visits');
  const devices = mergeDevices(report.deviceTypes);
  const devicesTotal = sum(devices, 'visits');
  const devicesLine = deviceSentence(report.deviceTypes);
  return (
    <>
      <section className={cn('stats-section', stale && 'stats-stale')} aria-labelledby="stats-devices">
        <h2 id="stats-devices">Devices</h2>
        {devicesTotal && devicesLine ? (
          <>
            <p className="stats-lead">{devicesLine}</p>
            <div className="stats-devices">
              <Suspense fallback={<div className="stats-donut-placeholder" />}>
                <DevicesChart devices={devices} />
              </Suspense>
              <ul className="stats-device-list" aria-label="Visits by device">
                {devices.map((row) => (
                  <li key={row.kind} data-kind={row.kind}>
                    <i className="stats-key-box" aria-hidden="true" />
                    <DeviceIcon kind={row.kind} />
                    <span>{deviceNames[row.kind].label}</span>
                    <span className="stats-figure">
                      {formatCount(row.visits)} · {share(row.visits, devicesTotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p className="stats-empty">No devices yet.</p>
        )}
      </section>
      <RankSection
        id="stats-referrers"
        title="Where visits came from"
        label="Source"
        stale={stale}
        total={visits}
        rows={mergeSources(report.topReferrers).map((row) => ({
          ...row,
          detail: row.hosts.join(', '),
          icon: <SourceIcon kind={row.kind} />,
        }))}
      />
      <RankSection
        id="stats-countries"
        title="Countries"
        label="Country"
        stale={stale}
        total={visits}
        rows={byVisits(report.topCountries).map((row) => ({
          ...row,
          key: row.country || 'unknown',
          name: countryLabel(row.country),
          detail: row.country || 'Unknown',
        }))}
      />
    </>
  );
}

/** Loading, failure and stale notice for one source; the section keeps its last figures below it. */
function SourceStatus<T>({ read, onRetry }: { read: StatsRead<T>; onRetry: () => void }) {
  if (read.loading && !read.data) return <Skeleton />;
  if (!read.error) return null;
  return (
    <div className="stats-error stats-section-error" role="alert">
      <TriangleAlert size={18} aria-hidden="true" />
      <div>
        <strong>{read.data ? "Couldn't refresh. Showing the last saved figures." : read.error.message}</strong>
        {read.data && <p>{read.error.message}</p>}
        {read.error.requestId && <p className="stats-muted">Reference: {read.error.requestId}</p>}
        <Button variant="outline" size="sm" onClick={onRetry} disabled={read.loading}>
          <RefreshCw aria-hidden="true" />
          Retry
        </Button>
      </div>
    </div>
  );
}

const periodWords = (range: SiteAnalyticsRange) =>
  range === '7d'
    ? { now: 'Last 7 days', before: '7 days before', inRange: 'in the last 7 days', theBefore: 'the 7 days before' }
    : {
        now: 'Last 30 days',
        before: '30 days before',
        inRange: 'in the last 30 days',
        theBefore: 'the 30 days before',
      };

function storeLead(now: number, before: number, range: SiteAnalyticsRange) {
  const words = periodWords(range);
  if (!now && !before) return `No orders paid ${words.inRange}.`;
  if (!now) return `Nothing paid ${words.inRange}, down from ${formatEuro(before)} ${words.theBefore}.`;
  if (!before) return `${formatEuro(now)} paid ${words.inRange}; nothing ${words.theBefore}.`;
  if (now === before) return `${formatEuro(now)} paid ${words.inRange}, the same as ${words.theBefore}.`;
  return `${formatEuro(now)} paid ${words.inRange}, ${now > before ? 'up' : 'down'} from ${formatEuro(before)} ${words.theBefore}.`;
}

function StoreSection({
  read,
  range,
  onRetry,
}: {
  read: StatsRead<StoreStats>;
  range: SiteAnalyticsRange;
  onRetry: () => void;
}) {
  const data = read.data;
  const words = periodWords(range);
  const now = data?.current;
  const before = data?.previous;
  const widest = Math.max(now?.paidTotalMinor ?? 0, before?.paidTotalMinor ?? 0);
  return (
    <section className="stats-section" aria-labelledby="stats-store">
      <h2 id="stats-store">
        <span className="stats-h-icon">
          <PageIcon kind="store" />
        </span>
        Store
      </h2>
      <SourceStatus read={read} onRetry={onRetry} />
      {now && before && (
        <div className={read.error ? 'stats-stale' : undefined}>
          <p className="stats-lead">{storeLead(now.paidTotalMinor, before.paidTotalMinor, range)}</p>
          {widest > 0 && (
            <div
              className="stats-compare"
              role="img"
              aria-label={`Paid total: ${formatEuro(before.paidTotalMinor)} ${words.theBefore}, ${formatEuro(now.paidTotalMinor)} ${words.inRange}`}
            >
              {[
                { label: words.before, value: before.paidTotalMinor, current: false },
                { label: words.now, value: now.paidTotalMinor, current: true },
              ].map((row) => (
                <div key={row.label} className={cn('stats-compare-row', row.current && 'now')}>
                  <span>{row.label}</span>
                  <span className="stats-compare-track">
                    <span className="stats-compare-bar" style={{ width: `${(row.value / widest) * 100}%` }} />
                  </span>
                  <b>{formatEuro(row.value)}</b>
                </div>
              ))}
            </div>
          )}
          <ul className="stats-figures" aria-label={`Store figures compared with ${words.theBefore}`}>
            <Figure label="Orders paid" now={now.paidOrders} before={before.paidOrders} words={words} />
            <Figure label="Items sold" now={now.itemsSold} before={before.itemsSold} words={words} />
            <Figure
              label="Checkouts started"
              now={now.checkoutsStarted}
              before={before.checkoutsStarted}
              words={words}
            />
          </ul>
          <p className="stats-section-note">
            {now.deliveryMinor ? `Paid totals include ${formatEuro(now.deliveryMinor)} delivery. ` : ''}
            Refunds made in Stripe aren't subtracted.
          </p>
        </div>
      )}
    </section>
  );
}

function Figure({
  label,
  now,
  before,
  words,
}: {
  label: string;
  now: number;
  before: number;
  words: ReturnType<typeof periodWords>;
}) {
  const diff = now - before;
  const [Icon, text, spoken] = !diff
    ? [Minus, 'same', `the same as ${words.theBefore}`]
    : !before
      ? [TrendingUp, 'new', `none ${words.theBefore}`]
      : [
          diff > 0 ? TrendingUp : TrendingDown,
          `${diff > 0 ? '+' : '−'}${formatCount(Math.abs(diff))}`,
          `${diff > 0 ? 'up' : 'down'} ${formatCount(Math.abs(diff))} from ${formatCount(before)}`,
        ];
  return (
    <li title={`${words.before}: ${formatCount(before)}`}>
      <span>{label}</span>
      <b>{formatCount(now)}</b>
      <span className="stats-change">
        <Icon aria-hidden="true" />
        <span aria-hidden="true">{text}</span>
        <span className="sr-only">, {spoken}</span>
      </span>
    </li>
  );
}

function SearchSection({ read, onRetry }: { read: StatsRead<SearchStats>; onRetry: () => void }) {
  const data = read.data;
  const totals = data?.status === 'ok' ? data.totals : null;
  return (
    <section className="stats-section" aria-labelledby="stats-search">
      <h2 id="stats-search">
        <span className="stats-h-icon">
          <Search className="stats-row-icon" aria-hidden="true" />
        </span>
        Google search
      </h2>
      <SourceStatus read={read} onRetry={onRetry} />
      {data?.status === 'not_configured' && <p className="stats-empty">Search figures aren't available here yet.</p>}
      {totals && !totals.impressions && <p className="stats-empty">No Google search data for this range yet.</p>}
      {data && totals && totals.impressions > 0 && (
        <div className={read.error ? 'stats-stale' : undefined}>
          <p className="stats-lead">
            <strong>{plural(totals.clicks, 'click')}</strong> from <strong>{formatCount(totals.impressions)}</strong>{' '}
            appearances in Google results.
            {totals.position !== null && (
              <>
                {' '}
                Average position <strong>{formatPosition(totals.position)}</strong>.
              </>
            )}
          </p>
          {data.topQueries.length > 0 && (
            <table className="stats-search-table">
              <thead>
                <tr>
                  <th scope="col">Search term</th>
                  <th scope="col">Clicks</th>
                  <th scope="col">Shown</th>
                  <th scope="col">Position</th>
                </tr>
              </thead>
              <tbody>
                {data.topQueries.map((row) => (
                  <tr key={row.query}>
                    <td>{row.query}</td>
                    <td>{formatCount(row.clicks)}</td>
                    <td>{formatCount(row.impressions)}</td>
                    <td>{formatPosition(row.position)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="stats-section-note">
            Google hides rare searches, so terms don't add up to the totals. Its days follow Pacific time
            {data.latestDate ? `; the latest day (${formatDayTick(data.latestDate)}) can still change.` : '.'}
          </p>
        </div>
      )}
    </section>
  );
}

function share(value: number, total: number) {
  if (!total || !value) return '0%';
  // Sampled top lists can slightly exceed the daily total; a share never reads above 100%.
  const percent = Math.min(100, (value / total) * 100);
  return percent < 1 ? '<1%' : `${Math.round(percent)}%`;
}

type RankRow = { key: string; name: string; detail: string; visits: number; pageViews: number; icon?: ReactNode };

function RankSection({
  id,
  title,
  label,
  rows,
  total,
  stale,
}: {
  id: string;
  title: string;
  label: string;
  rows: RankRow[];
  total: number;
  stale: boolean;
}) {
  const max = Math.max(1, ...rows.map((row) => row.visits));
  return (
    <section className={cn('stats-section', stale && 'stats-stale')} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {rows.length ? (
        <table className="stats-rank">
          <thead>
            <tr>
              <th scope="col">{label}</th>
              <th scope="col">Visits · share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} title={`${row.detail} · ${formatCount(row.pageViews)} page views`}>
                <td>
                  <span className="stats-rank-name">
                    {row.icon}
                    <span>{row.name}</span>
                  </span>
                  <span className="stats-rank-bar" style={{ width: `${(row.visits / max) * 100}%` }} />
                </td>
                <td>
                  {formatCount(row.visits)} · {share(row.visits, total)}
                  <span className="sr-only">, {formatCount(row.pageViews)} page views</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="stats-empty">Nothing recorded yet.</p>
      )}
    </section>
  );
}
