import { lazy, Suspense, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { LockKeyhole, RefreshCw, TriangleAlert } from 'lucide-react';
import {
  createInternalAnalyticsApi,
  type SiteAnalytics,
  type SiteAnalyticsRange,
} from '../../lib/backend/internal-analytics-api';
import { writeStaffLocation } from '../../lib/staff-navigation';
import { useStaffRead } from '../../lib/staff-query';
import { Button } from '../ui/button';
import { createStatsWorkspace, type StatsState } from './stats-workspace';
import { countryLabel, formatCount, formatDay, formatReadTime } from './stats-format';
import { byVisits, deviceNames, mergeDevices, mergeSources, pageLabel } from './stats-labels';
import { deviceSentence, summarySentence } from './stats-summary';
import { DeviceIcon, PageIcon, SourceIcon } from './StatsIcons';

// Recharts loads only when a chart is drawn, after the page and its states are already usable.
const TrafficChart = lazy(() => import('./StatsCharts').then((module) => ({ default: module.TrafficChart })));
const DevicesChart = lazy(() => import('./StatsCharts').then((module) => ({ default: module.DevicesChart })));

const rangeFromUrl = (): SiteAnalyticsRange =>
  new URLSearchParams(window.location.search).get('range') === '30d' ? '30d' : '7d';
const sum = (rows: { visits: number; pageViews: number }[], key: 'visits' | 'pageViews') =>
  rows.reduce((total, row) => total + row[key], 0);

export default function StatsWorkspace({ backendBaseUrl }: { backendBaseUrl: string }) {
  const workspace = useMemo(
    () => createStatsWorkspace(createInternalAnalyticsApi({ backendBaseUrl })),
    [backendBaseUrl],
  );
  const state = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot, workspace.getSnapshot);
  useEffect(() => {
    const followUrl = () => void workspace.load(rangeFromUrl());
    followUrl();
    window.addEventListener('popstate', followUrl);
    return () => window.removeEventListener('popstate', followUrl);
  }, [workspace]);
  useStaffRead(['site-analytics', state.range], () => workspace.load(state.range), { enabled: !state.denied });

  return (
    <StatsView
      state={state}
      onRange={(range) => {
        writeStaffLocation(range === '30d' ? '/stats/?range=30d' : '/stats/');
        void workspace.load(range);
      }}
      onRetry={() => void workspace.load(state.range)}
    />
  );
}

export function StatsView({
  state,
  onRange,
  onRetry,
}: {
  state: StatsState;
  onRange: (range: SiteAnalyticsRange) => void;
  onRetry: () => void;
}) {
  if (state.denied)
    return (
      <div className="staff-workspace stats-workspace stats-message">
        <LockKeyhole size={36} aria-hidden="true" />
        <h1>Access required</h1>
        <p>Your staff session may have expired, or this account does not have access.</p>
        <p>Sign in with an allowed staff account and reload to continue.</p>
      </div>
    );

  const read = state.reads[state.range];
  const data = read.data;
  return (
    <div className="staff-workspace stats-workspace">
      <header className="stats-heading">
        <h1>Stats</h1>
        <div className="stats-heading-side">
          <div className="stats-range" role="group" aria-label="Range">
            {(['7d', '30d'] as const).map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={state.range === range}
                onClick={() => state.range !== range && onRange(range)}
              >
                {range === '7d' ? '7 days' : '30 days'}
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
            <Button variant="outline" onClick={onRetry} disabled={read.loading}>
              <RefreshCw aria-hidden="true" />
              Retry
            </Button>
          </div>
        </div>
      )}
      <div role="status" aria-live="polite" className="stats-load-status">
        {read.loading ? (data ? 'Refreshing stats…' : 'Loading stats…') : ''}
      </div>
      {read.loading && !data && <Placeholder />}
      {data?.status === 'not_configured' && (
        <section className="stats-message" aria-labelledby="stats-setup">
          <h2 id="stats-setup">Stats aren't available here yet</h2>
          <p>Visit figures will appear here once they are connected.</p>
        </section>
      )}
      {data?.status === 'ok' && <StatsReport data={data} stale={!!read.error} />}
    </div>
  );
}

function Placeholder() {
  return (
    <div className="stats-columns" aria-hidden="true">
      <div className="stats-skeleton">
        <span className="tall" />
        <span />
      </div>
      <div className="stats-skeleton">
        <span />
        <span />
      </div>
    </div>
  );
}

function StatsReport({ data, stale }: { data: SiteAnalytics; stale: boolean }) {
  const visits = sum(data.daily, 'visits');
  const lastDay = data.daily.at(-1)?.date;
  const devices = mergeDevices(data.deviceTypes);
  const devicesTotal = sum(devices, 'visits');
  const devicesLine = deviceSentence(data.deviceTypes);
  return (
    <div className={stale ? 'stats-stale' : undefined}>
      {visits === 0 ? (
        <p className="stats-summary">
          No visits recorded in the {data.range === '7d' ? 'last 7 days' : 'last 30 days'}. Counting starts when the
          live site is open to visitors.
        </p>
      ) : (
        <p className="stats-summary">
          {summarySentence(data).map((part, index) =>
            typeof part === 'string' ? part : <strong key={index}>{part.strong}</strong>,
          )}
        </p>
      )}
      <div className="stats-columns">
        <div>
          {visits > 0 && (
            <section className="stats-section" aria-labelledby="stats-traffic">
              <h2 id="stats-traffic">Visits per day</h2>
              <Suspense fallback={<div className="stats-chart-placeholder" />}>
                <TrafficChart daily={data.daily} />
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
                    {data.daily.map((day) => (
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
          )}
          <RankSection
            id="stats-pages"
            title="Top pages"
            label="Page"
            total={visits}
            rows={byVisits(data.topPaths).map((row) => {
              const page = pageLabel(row.path);
              return { ...row, key: row.path, name: page.name, detail: row.path, icon: <PageIcon kind={page.kind} /> };
            })}
          />
        </div>
        <div className="stats-rail">
          <section className="stats-section" aria-labelledby="stats-devices">
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
            total={visits}
            rows={mergeSources(data.topReferrers).map((row) => ({
              ...row,
              detail: row.hosts.join(', '),
              icon: <SourceIcon kind={row.kind} />,
            }))}
          />
          <RankSection
            id="stats-countries"
            title="Countries"
            label="Country"
            total={visits}
            rows={byVisits(data.topCountries).map((row) => ({
              ...row,
              key: row.country || 'unknown',
              name: countryLabel(row.country),
              detail: row.country || 'Unknown',
            }))}
          />
        </div>
      </div>
      <footer className="stats-notes">
        <p>Figures are estimates from Cloudflare; a visit is not a unique person.</p>
        <p>Days run midnight to midnight UTC and include today so far.</p>
      </footer>
    </div>
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
}: {
  id: string;
  title: string;
  label: string;
  rows: RankRow[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((row) => row.visits));
  return (
    <section className="stats-section" aria-labelledby={id}>
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
