import { lazy, Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, LockKeyhole, RefreshCw, TriangleAlert } from 'lucide-react';
import { createInternalAnalyticsApi, type StaffStatsReport } from '../../lib/backend/internal-analytics-api';
import { writeStaffLocation } from '../../lib/staff-navigation';
import { useStaffRead } from '../../lib/staff-query';
import { Button } from '../ui/button';
import { createStatsWorkspace, idleRead, statsQueryKey, type StatsRead } from './stats-workspace';
import {
  briefLocation,
  customDateError,
  groupStatsDays,
  metricValue,
  parseBriefLocation,
  periodDates,
  periodLabel,
  presets,
  reportQuery,
  sourceNames,
  sources,
  type BriefState,
  type Range,
  type Source,
} from './stats-model';
import { formatReadTime } from './stats-format';
import { Comparison } from './StatsComparison';

const StatsDetail = lazy(() => import('./StatsDetail'));
export type BriefReads = Record<Source, StatsRead>;

export default function StatsWorkspace({
  backendBaseUrl,
  initialSearch = '',
}: {
  backendBaseUrl: string;
  initialSearch?: string;
}) {
  const [state, setState] = useState(() => parseBriefLocation(initialSearch));
  const [ready, setReady] = useState(false);
  const stores = useMemo(() => {
    const api = createInternalAnalyticsApi({ backendBaseUrl });
    return {
      visits: createStatsWorkspace(api.readStatsReport),
      store: createStatsWorkspace(api.readStatsReport),
      search: createStatsWorkspace(api.readStatsReport),
    };
  }, [backendBaseUrl]);
  const visits = useSyncExternalStore(stores.visits.subscribe, stores.visits.getSnapshot, stores.visits.getSnapshot);
  const store = useSyncExternalStore(stores.store.subscribe, stores.store.getSnapshot, stores.store.getSnapshot);
  const search = useSyncExternalStore(stores.search.subscribe, stores.search.getSnapshot, stores.search.getSnapshot);
  const denied = visits.denied || store.denied || search.denied;
  const queries = {
    visits: reportQuery('visits', state),
    store: reportQuery('store', state),
    search: reportQuery('search', state),
  };
  const keys = {
    visits: statsQueryKey(queries.visits),
    store: statsQueryKey(queries.store),
    search: statsQueryKey(queries.search),
  };
  useEffect(() => {
    const follow = () => setState(parseBriefLocation(window.location.search));
    follow();
    setReady(true);
    window.addEventListener('popstate', follow);
    return () => window.removeEventListener('popstate', follow);
  }, []);
  useEffect(() => {
    if (!ready) return;
    if (denied) {
      for (const source of sources) if (!stores[source].getSnapshot().denied) stores[source].deny();
      return;
    }
    for (const source of sources) void stores[source].load(queries[source]);
  }, [keys.visits, keys.store, keys.search, ready, denied, stores]);
  useStaffRead(['staff-stats', keys.visits], () => stores.visits.load(queries.visits, true), {
    enabled: ready && !denied,
  });
  useStaffRead(['staff-stats', keys.store], () => stores.store.load(queries.store, true), {
    enabled: ready && !denied,
  });
  useStaffRead(['staff-stats', keys.search], () => stores.search.load(queries.search, true), {
    enabled: ready && !denied,
  });
  const reads = {
    visits: visits.reads[keys.visits] ?? idleRead,
    store: store.reads[keys.store] ?? idleRead,
    search: search.reads[keys.search] ?? idleRead,
  };
  return (
    <StatsView
      state={state}
      reads={reads}
      denied={denied}
      onChange={(next) => {
        setState(next);
        writeStaffLocation(briefLocation(next), { push: true });
      }}
      onRetry={(source) => void stores[source].load(queries[source], true)}
    />
  );
}

export function StatsView({
  state,
  reads,
  denied = false,
  onChange,
  onRetry,
}: {
  state: BriefState;
  reads: BriefReads;
  denied?: boolean;
  onChange: (state: BriefState) => void;
  onRetry: (source: Source) => void;
}) {
  const [dates, setDates] = useState(false);
  const [draft, setDraft] = useState({ range: state.range, start: state.start, end: state.end });
  const [issue, setIssue] = useState<string | null>(null);
  const dateButton = useRef<HTMLButtonElement>(null),
    workspace = useRef<HTMLDivElement>(null);
  const previousReport = useRef(state.report);
  useEffect(() => {
    setDates(false);
    setIssue(null);
    if (previousReport.current !== state.report) {
      const selector =
        state.report === 'overview' ? `[data-stats-open="${previousReport.current}"]` : '#stats-report-title';
      workspace.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
      previousReport.current = state.report;
    }
  }, [state.report, state.range, state.start, state.end]);
  if (denied)
    return (
      <div className="staff-workspace stats-workspace stats-message">
        <LockKeyhole aria-hidden="true" size={36} />
        <h1>Access required</h1>
        <p>Your staff session may have expired, or this account does not have access.</p>
        <p>Sign in with an allowed staff account and reload to continue.</p>
      </div>
    );
  const applyDates = () => {
    const problem = draft.range === 'custom' ? customDateError(draft.start, draft.end) : null;
    if (problem) {
      setIssue(problem);
      return;
    }
    const length = (Date.parse(draft.end) - Date.parse(draft.start)) / 86400000 + 1;
    onChange({ ...state, ...draft, grain: length > 120 ? 'Months' : length > 31 ? 'Weeks' : 'Days' });
    setDates(false);
    dateButton.current?.focus();
  };
  const start = state.range === 'custom' ? state.start : periodDates(state.range).start;
  const end = state.range === 'custom' ? state.end : periodDates(state.range).end;
  const visits = reads.visits.data,
    store = reads.store.data;
  return (
    <div ref={workspace} className="staff-workspace stats-workspace stats-daily-brief">
      <header className="stats-heading">
        <h1>{state.report === 'overview' ? 'Your stats' : 'Stats'}</h1>
      </header>
      <div className="stats-period-toolbar">
        <button
          ref={dateButton}
          type="button"
          className="stats-date-button"
          aria-expanded={dates}
          aria-controls="stats-period-panel"
          onClick={() => {
            setDraft({ range: state.range, start, end });
            setIssue(null);
            setDates(!dates);
          }}
        >
          <CalendarDays aria-hidden="true" size={18} />
          <span>
            <strong>{periodLabel(start, end)}</strong>
            <small>{presets.find(([key]) => key === state.range)?.[1]}</small>
          </span>
          <ChevronDown aria-hidden="true" size={18} />
        </button>
        {dates && (
          <DatePanel
            draft={draft}
            issue={issue}
            onDraft={(next) => {
              setDraft(next);
              setIssue(null);
            }}
            onApply={applyDates}
            onCancel={() => {
              setDates(false);
              dateButton.current?.focus();
            }}
          />
        )}
      </div>
      <label className="stats-compare-toggle">
        <input
          type="checkbox"
          checked={state.compare}
          onChange={(event) => onChange({ ...state, compare: event.target.checked })}
        />
        Compare with previous period
      </label>
      {state.report === 'overview' ? (
        <>
          <p className="stats-brief-sentence">
            {visits?.status === 'ok' && visits.daily.some((day) => day.available) && (
              <>
                <strong>{metricValue('visits', visits.totals.visits)} visits.</strong>{' '}
              </>
            )}
            {store?.status === 'ok' && (
              <>
                <strong>{metricValue('paidOrders', store.totals.paidOrders)} paid orders.</strong>{' '}
              </>
            )}
            Here's the period at a glance.
          </p>
          <div className="stats-brief-reports">
            {sources.map((source) => (
              <BriefReport
                key={source}
                source={source}
                read={reads[source]}
                state={state}
                onOpen={() => onChange({ ...state, report: source })}
                onRetry={() => onRetry(source)}
              />
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className="stats-text-action stats-back-brief"
            onClick={() => onChange({ ...state, report: 'overview' })}
          >
            <ArrowLeft aria-hidden="true" size={17} />
            Back to brief
          </button>
          <h2 id="stats-report-title" tabIndex={-1}>
            {sourceNames[state.report]}
          </h2>
          <SourceStatus
            source={state.report}
            read={reads[state.report]}
            onRetry={() => onRetry(state.report as Source)}
          />
          {reads[state.report].data?.status === 'ok' && (
            <Suspense fallback={<p role="status">Loading report controls…</p>}>
              <StatsDetail key={state.report} report={reads[state.report].data!} state={state} onChange={onChange} />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}

type Draft = { range: Range; start: string; end: string };
export function DatePanel({
  draft,
  issue,
  onDraft,
  onApply,
  onCancel,
}: {
  draft: Draft;
  issue: string | null;
  onDraft: (draft: Draft) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10),
    minimum = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  return (
    <section
      id="stats-period-panel"
      className="stats-edit-panel"
      aria-label="Choose date range"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <h2>Date range</h2>
      <div className="stats-date-presets">
        {presets.map(([key, label]) => (
          <button
            type="button"
            key={key}
            aria-pressed={draft.range === key}
            onClick={() => onDraft(key === 'custom' ? { ...draft, range: key } : { range: key, ...periodDates(key) })}
          >
            {label}
          </button>
        ))}
      </div>
      {draft.range === 'custom' && (
        <div className="stats-edit-fields">
          <label>
            Start date
            <input
              type="date"
              min={minimum}
              max={today}
              value={draft.start}
              aria-invalid={!!issue}
              onChange={(event) => onDraft({ ...draft, start: event.target.value })}
            />
          </label>
          <label>
            End date
            <input
              type="date"
              min={minimum}
              max={today}
              value={draft.end}
              aria-invalid={!!issue}
              onChange={(event) => onDraft({ ...draft, end: event.target.value })}
            />
          </label>
        </div>
      )}
      <p className="stats-muted">Up to 12 months. Each report shows its available history.</p>
      {issue && (
        <p role="alert" className="stats-date-error">
          {issue}
        </p>
      )}
      <div className="stats-edit-actions">
        <Button onClick={onApply}>Apply dates</Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}

function BriefReport({
  source,
  read,
  state,
  onOpen,
  onRetry,
}: {
  source: Source;
  read: StatsRead;
  state: BriefState;
  onOpen: () => void;
  onRetry: () => void;
}) {
  const report = read.data?.status === 'ok' ? read.data : null;
  const key = source === 'visits' ? 'visits' : source === 'store' ? 'paidTotalMinor' : 'clicks';
  const known = report?.daily.some((day) => day.available);
  const active = Object.keys(state.filters[source]).length;
  return (
    <section className={`stats-brief-report stats-source-${source}`} aria-labelledby={`stats-brief-${source}`}>
      <div className="stats-brief-report-heading">
        <h2 id={`stats-brief-${source}`}>{sourceNames[source]}</h2>
        {report && known && (
          <strong>
            {metricValue(key, report.totals[key])}
            {source === 'search' ? ' clicks' : ''}
          </strong>
        )}
      </div>
      <SourceStatus source={source} read={read} onRetry={onRetry} />
      {report && (
        <>
          {!report.complete && (
            <p className="stats-coverage">
              {known ? 'Partial figures for this selection.' : 'Figures for these dates are not available yet.'}
            </p>
          )}
          {known && (
            <>
              <BriefSpark report={report} metric={key} grain={state.grain} />
              <Comparison report={report} metric={key} enabled={state.compare} />
              <p className="stats-muted">
                {source === 'visits'
                  ? `${metricValue('pageViews', report.totals.pageViews)} page views`
                  : source === 'store'
                    ? `${metricValue('itemsSold', report.totals.itemsSold)} items sold${report.moneyBasis === 'merchandise' ? ' · merchandise only' : ''}`
                    : `${metricValue('impressions', report.totals.impressions)} impressions`}
                {active ? ` · ${active} active ${active === 1 ? 'filter' : 'filters'}` : ''}
              </p>
            </>
          )}
        </>
      )}
      <button type="button" className="stats-open-report" data-stats-open={source} onClick={onOpen}>
        Explore {source === 'search' ? 'Search' : sourceNames[source]}
        <ArrowRight size={17} aria-hidden="true" />
      </button>
      {report?.generatedAt && (
        <p className="stats-muted">
          Read at {formatReadTime(report.generatedAt)}.
          {source === 'search'
            ? ` Data through ${report.latestDate ?? 'an unavailable day'} · Pacific Time.`
            : ' Days follow UTC.'}
        </p>
      )}
    </section>
  );
}

export function SourceStatus({ source, read, onRetry }: { source: Source; read: StatsRead; onRetry: () => void }) {
  return (
    <>
      {read.loading && !read.data && (
        <div className="stats-report-loading" role="status" aria-label={`Loading ${sourceNames[source]}`}>
          <span>Loading {sourceNames[source].toLowerCase()}…</span>
          <div className="stats-brief-skeleton" />
        </div>
      )}
      {read.loading && read.data && (
        <p role="status" className="stats-muted">
          Refreshing figures…
        </p>
      )}
      {read.error && (
        <div className="stats-error" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <div>
            <strong>
              {read.data ? "Couldn't refresh. Showing the last successful figures." : 'Unable to load these figures.'}
            </strong>
            <p>{read.error.message}</p>
            {read.data?.generatedAt && (
              <p className="stats-muted">Last successful read: {formatReadTime(read.data.generatedAt)}.</p>
            )}
            {read.error.requestId && <p className="stats-muted">Reference: {read.error.requestId}</p>}
            <Button variant="outline" disabled={read.loading} onClick={onRetry}>
              <RefreshCw aria-hidden="true" />
              Retry
            </Button>
          </div>
        </div>
      )}
      {read.data?.status === 'not_configured' && (
        <p className="stats-setup-message">
          {sourceNames[source]} figures aren't available here yet. They'll appear once connected.
        </p>
      )}
    </>
  );
}

function BriefSpark({
  report,
  metric,
  grain,
}: {
  report: StaffStatsReport;
  metric: string;
  grain: BriefState['grain'];
}) {
  const points = groupStatsDays(report.daily, grain),
    maximum = Math.max(1, ...points.map((point) => point.metrics[metric] ?? 0));
  return (
    <div
      className="stats-brief-spark"
      role="img"
      aria-label={`${sourceNames[report.source]} trend over ${periodLabel(report.period.start, report.period.end)}. Missing dates are gaps.`}
    >
      {points.map((point) => (
        <span
          key={point.date}
          style={{ height: point.available ? `${Math.max(2, (100 * (point.metrics[metric] ?? 0)) / maximum)}%` : '0%' }}
        />
      ))}
    </div>
  );
}
