import { useEffect, useMemo, useRef, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { StaffStatsReport } from '../../lib/backend/internal-analytics-api';
import { Button } from '../ui/button';
import { Comparison } from './StatsComparison';
import {
  dimensionKeys,
  groupStatsDays,
  metricOptions,
  metricValue,
  periodLabel,
  shortDate,
  type BriefState,
  type Dimension,
} from './stats-model';

export default function StatsDetail({
  report,
  state,
  onChange,
}: {
  report: StaffStatsReport;
  state: BriefState;
  onChange: (state: BriefState) => void;
}) {
  const source = report.source,
    filters = state.filters[source],
    metric = state.metrics[source];
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(filters);
  const filterButton = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLElement>(null);
  const [table, setTable] = useState(false),
    [selected, setSelected] = useState(0);
  const chart = useRef<HTMLDivElement>(null);
  const points = useMemo(() => groupStatsDays(report.daily, state.grain), [report.daily, state.grain]);
  const point = points[Math.min(selected, Math.max(0, points.length - 1))];
  const maximum = Math.max(1, ...points.map((point) => point.metrics[metric] ?? 0));
  const group = state.groups[source],
    breakdown = report.breakdowns.find((item) => item.dimension === group);
  const fieldLabel = (key: Dimension) => report.fields.find((field) => field.key === key)?.label ?? key;
  const changeFilters = (next: typeof filters) => onChange({ ...state, filters: { ...state.filters, [source]: next } });
  const closeFilters = () => {
    setEditing(false);
    filterButton.current?.focus();
  };
  useEffect(() => {
    if (editing) panel.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, [editing]);
  useEffect(() => {
    setSelected(0);
  }, [report, state.grain]);
  return (
    <div className={`stats-detail stats-source-${source}`}>
      <div className="stats-detail-controls">
        <button
          ref={filterButton}
          type="button"
          className="stats-filter-button"
          aria-expanded={editing}
          aria-controls="stats-source-filters"
          onClick={() => {
            setDraft({ ...filters });
            setEditing(!editing);
          }}
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          Filters{Object.keys(filters).length ? ` · ${Object.keys(filters).length}` : ''}
        </button>
        <span className="stats-muted">Days follow {report.timezone === 'UTC' ? 'UTC' : 'Pacific Time'}</span>
      </div>
      {editing && (
        <section
          ref={panel}
          id="stats-source-filters"
          className="stats-edit-panel"
          aria-label="Report filters"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              closeFilters();
            }
          }}
        >
          <h3>Filter this report</h3>
          <p className="stats-muted">Choose a suggestion or enter an exact value. Filters apply together.</p>
          <div className="stats-edit-fields">
            {report.fields.map((field) => (
              <label key={field.key}>
                {field.label}
                <input
                  aria-label={field.label}
                  type="text"
                  maxLength={4096}
                  list={`stats-options-${field.key}`}
                  value={draft[field.key] ?? ''}
                  placeholder="All"
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                />
                <datalist id={`stats-options-${field.key}`}>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </datalist>
              </label>
            ))}
          </div>
          <div className="stats-edit-actions">
            <Button
              onClick={() => {
                changeFilters(Object.fromEntries(Object.entries(draft).filter(([, value]) => !!value)));
                closeFilters();
              }}
            >
              Apply filters
            </Button>
            <Button variant="outline" onClick={closeFilters}>
              Cancel
            </Button>
            <Button variant="ghost" onClick={() => setDraft({})}>
              Clear all
            </Button>
          </div>
        </section>
      )}
      {!!Object.keys(filters).length && (
        <div className="stats-active-filters" aria-label="Active filters">
          {Object.entries(filters).map(([key, value]) => (
            <button
              key={key}
              type="button"
              aria-label={`Remove ${fieldLabel(key as Dimension)} filter: ${value}`}
              onClick={() => {
                const next = { ...filters };
                delete next[key as Dimension];
                changeFilters(next);
              }}
            >
              <span>
                {fieldLabel(key as Dimension)}: {value}
              </span>
              <X size={16} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <div className="stats-metrics">
        {metricOptions[source].map(([key, label]) => (
          <button
            type="button"
            key={key}
            aria-pressed={metric === key}
            onClick={() => onChange({ ...state, metrics: { ...state.metrics, [source]: key } })}
          >
            <span>{label === 'Paid total' && report.moneyBasis === 'merchandise' ? 'Merchandise total' : label}</span>
            <strong>{report.daily.some((day) => day.available) ? metricValue(key, report.totals[key]) : '—'}</strong>
          </button>
        ))}
      </div>
      {!report.complete && (
        <p className="stats-coverage">Partial period. Missing dates remain gaps and are excluded from these figures.</p>
      )}
      <Comparison report={report} metric={metric} enabled={state.compare} />
      <section className="stats-trend" aria-label="Trend">
        <div className="stats-trend-heading">
          <h3>{metricOptions[source].find(([key]) => key === metric)?.[1]}</h3>
          <div className="stats-grain" aria-label="Group dates">
            {(['Days', 'Weeks', 'Months'] as const).map((grain) => (
              <button
                key={grain}
                type="button"
                aria-pressed={grain === state.grain}
                onClick={() => onChange({ ...state, grain })}
              >
                {grain}
              </button>
            ))}
          </div>
        </div>
        <p className="stats-point-value" aria-live="polite">
          {point ? (
            <>
              <strong>{point.available ? metricValue(metric, point.metrics[metric]) : 'Unavailable'}</strong>
              <span>
                {periodLabel(point.date, point.end)}
                {point.available && point.partial ? ' · Partial' : ''}
              </span>
            </>
          ) : (
            'No dates available.'
          )}
        </p>
        <div
          ref={chart}
          className="stats-interactive-chart"
          aria-label="Inspect trend dates"
          onKeyDown={(event) => {
            let next: number;
            if (event.key === 'ArrowRight') next = Math.min(points.length - 1, selected + 1);
            else if (event.key === 'ArrowLeft') next = Math.max(0, selected - 1);
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = points.length - 1;
            else return;
            event.preventDefault();
            setSelected(next);
            chart.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
          }}
        >
          {points.map((row, index) => (
            <button
              key={row.date}
              type="button"
              tabIndex={index === selected ? 0 : -1}
              aria-pressed={index === selected}
              aria-label={`${periodLabel(row.date, row.end)}: ${row.available ? metricValue(metric, row.metrics[metric]) : 'unavailable'}${row.available && row.partial ? ' (partial)' : ''}`}
              onClick={() => setSelected(index)}
              onFocus={() => setSelected(index)}
            >
              <span
                className={row.available && typeof row.metrics[metric] === 'number' ? '' : 'stats-chart-gap'}
                style={{
                  height:
                    row.available && typeof row.metrics[metric] === 'number'
                      ? `${Math.max(2, (100 * (row.metrics[metric] ?? 0)) / maximum)}%`
                      : '100%',
                }}
              />
            </button>
          ))}
        </div>
        <div className="stats-chart-dates">
          <span>{points[0] && shortDate(points[0].date)}</span>
          <span>{points.at(-1) && shortDate(points.at(-1)!.end)}</span>
        </div>
        <p className="stats-muted">Tap a bar to inspect. Scroll for more dates; arrow keys move between them.</p>
        <button type="button" className="stats-text-action" aria-expanded={table} onClick={() => setTable(!table)}>
          {table ? 'Hide' : 'Show'} date table
        </button>
        {table && (
          <div className="stats-table-scroll">
            <table>
              <caption>Figures by {state.grain.toLowerCase()}</caption>
              <thead>
                <tr>
                  <th scope="col">Period</th>
                  {metricOptions[source].map(([key, label]) => (
                    <th key={key} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {points.map((row) => (
                  <tr key={row.date}>
                    <th scope="row">{periodLabel(row.date, row.end)}</th>
                    {metricOptions[source].map(([key]) => (
                      <td key={key}>{row.available ? metricValue(key, row.metrics[key]) : 'Unavailable'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="stats-breakdown" aria-label="Breakdown">
        <label className="stats-group-label">
          Group by
          <select
            value={group}
            onChange={(event) =>
              onChange({ ...state, groups: { ...state.groups, [source]: event.target.value as Dimension } })
            }
          >
            {dimensionKeys[source].map((key) => (
              <option key={key} value={key}>
                {fieldLabel(key)}
              </option>
            ))}
          </select>
        </label>
        <p className="stats-muted">Tap a row to filter by it. Up to 100 results.</p>
        {breakdown?.rows.length ? (
          <ol>
            {breakdown.rows.map((row) => (
              <li key={row.value}>
                <button type="button" onClick={() => changeFilters({ ...filters, [group]: row.value })}>
                  <span>{row.label || 'Unknown'}</span>
                  <strong>{metricValue(metric, row.metrics[metric])}</strong>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="stats-empty">No matching results for these dates and filters.</p>
        )}
      </section>
      <aside className="stats-report-notes" aria-label="About these figures">
        {report.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </aside>
    </div>
  );
}
