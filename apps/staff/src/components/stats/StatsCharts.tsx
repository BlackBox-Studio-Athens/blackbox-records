import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from '../ui/chart';
import type { SiteAnalytics } from '../../lib/backend/internal-analytics-api';
import { formatCount, formatDay, formatDayTick } from './stats-format';
import { deviceNames, type DeviceKind } from './stats-labels';

// Loaded on demand by StatsWorkspace so Recharts stays in the Stats chunk only.
const trafficConfig = { visits: { label: 'Visits', color: 'var(--stats-visits)' } } satisfies ChartConfig;
type Day = SiteAnalytics['daily'][number];

function TrafficTooltip({ active, payload, last }: Partial<TooltipContentProps<number, string>> & { last: string }) {
  const day = payload?.[0]?.payload as Day | undefined;
  if (!active || !day) return null;
  return (
    <div className="stats-tooltip">
      <strong>
        {formatDay(day.date)}
        {day.date === last ? ' (so far)' : ''}
      </strong>
      <span>
        <i aria-hidden="true" /> Visits <b>{formatCount(day.visits)}</b>
      </span>
      <span>
        Page views <b>{formatCount(day.pageViews)}</b>
      </span>
    </div>
  );
}

export function TrafficChart({ daily }: { daily: SiteAnalytics['daily'] }) {
  const last = daily.at(-1)?.date ?? '';
  const rows = daily.map((day) => ({ ...day, visits: Math.round(day.visits), pageViews: Math.round(day.pageViews) }));
  const busiest = rows.reduce((top, day) => (day.visits > top.visits ? day : top), rows[0]!);
  // The partial current day would understate the average, so only complete days count.
  const complete = rows.slice(0, -1);
  const average = complete.length ? complete.reduce((sum, day) => sum + day.visits, 0) / complete.length : 0;
  return (
    <>
      {average > 0 && (
        <p className="stats-chart-key">
          <i aria-hidden="true" />
          Daily average {formatCount(average)} visits
        </p>
      )}
      <ChartContainer config={trafficConfig} className="stats-chart aspect-auto h-64 w-full">
        <BarChart data={rows} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={20}
            tickFormatter={formatDayTick}
          />
          <YAxis tickLine={false} axisLine={false} width={36} allowDecimals={false} tickFormatter={formatCount} />
          <ChartTooltip cursor={{ fill: 'var(--stats-cursor)' }} content={<TrafficTooltip last={last} />} />
          {average > 0 && (
            <ReferenceLine y={average} stroke="var(--stats-average)" strokeDasharray="4 4" ifOverflow="extendDomain" />
          )}
          <Bar
            dataKey="visits"
            fill="var(--color-visits)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          >
            {rows.map((day) => (
              <Cell key={day.date} fillOpacity={day.date === last ? 0.45 : 1} />
            ))}
            <LabelList
              dataKey="visits"
              position="top"
              offset={6}
              className="stats-peak-label"
              content={(props) => {
                const { x, y, width, index } = props as { x: number; y: number; width: number; index: number };
                if (rows[index]?.date !== busiest.date || !busiest.visits) return null;
                return (
                  <text x={x + width / 2} y={y - 6} textAnchor="middle" className="stats-peak-label">
                    {formatCount(busiest.visits)}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </>
  );
}

const deviceColors: Record<DeviceKind, string> = {
  phone: 'var(--stats-visits)',
  desktop: 'var(--stats-neutral-1)',
  tablet: 'var(--stats-neutral-2)',
  other: 'var(--stats-neutral-3)',
};

export function DevicesChart({ devices }: { devices: { kind: DeviceKind; visits: number }[] }) {
  const total = devices.reduce((sum, row) => sum + row.visits, 0);
  const first = devices[0]!;
  const config = Object.fromEntries(
    devices.map((row) => [row.kind, { label: deviceNames[row.kind].label, color: deviceColors[row.kind] }]),
  ) satisfies ChartConfig;
  return (
    <div className="stats-donut" aria-hidden="true">
      <ChartContainer config={config} className="stats-chart aspect-square h-40 w-40">
        <PieChart>
          <Pie
            data={devices}
            dataKey="visits"
            nameKey="kind"
            innerRadius="68%"
            outerRadius="100%"
            paddingAngle={devices.length > 1 ? 2 : 0}
            stroke="none"
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {devices.map((row) => (
              <Cell key={row.kind} fill={deviceColors[row.kind]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <span className="stats-donut-centre">
        <b>{Math.round((first.visits / total) * 100)}%</b>
        {deviceNames[first.kind].short}
      </span>
    </div>
  );
}
