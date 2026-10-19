import type { StaffStatsReport } from '../../lib/backend/internal-analytics-api';
import { metricValue, periodLabel } from './stats-model';

export function Comparison({
  report,
  metric,
  enabled,
}: {
  report: StaffStatsReport;
  metric: string;
  enabled: boolean;
}) {
  if (!enabled) return null;
  const current = report.totals[metric],
    previous = report.previous?.[metric];
  if (previous === null || previous === undefined || current === null || current === undefined)
    return <p className="stats-comparison stats-muted">Comparison unavailable: incomplete data for these periods.</p>;
  const difference = previous ? (100 * (current - previous)) / previous : null;
  return (
    <div className="stats-comparison">
      <p>
        {difference === null ? (
          'No previous-period baseline.'
        ) : (
          <>
            <strong>
              {difference > 0 ? '↑' : difference < 0 ? '↓' : '→'} {Math.abs(difference).toFixed(1)}%
            </strong>{' '}
            vs {metricValue(metric, previous)} previously
          </>
        )}
      </p>
      <p className="stats-muted">
        Compared with {periodLabel(report.period.previousStart, report.period.previousEnd)}
        {metric === 'position' ? ' · Lower position is better.' : ''}
      </p>
    </div>
  );
}
