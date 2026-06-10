"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCentsWhole, formatNumber } from "@/lib/format";

const PRIMARY = "hsl(245 75% 60%)";
const GRID = "hsl(240 14% 91%)";
const AXIS = "hsl(224 12% 46%)";

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  formatter: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-muted-foreground tabular">{formatter(payload[0].value)}</p>
    </div>
  );
}

export function SalesOverTimeChart({ data }: { data: { day: string; cents: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.22} />
            <stop offset="100%" stopColor={PRIMARY} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fill: AXIS, fontSize: 12 }}
          tickMargin={10}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: AXIS, fontSize: 12 }}
          width={52}
          tickFormatter={(v) => formatCentsWhole(v as number)}
        />
        <Tooltip
          cursor={{ stroke: GRID }}
          content={<ChartTooltip formatter={formatCentsWhole} />}
        />
        <Area
          type="monotone"
          dataKey="cents"
          stroke={PRIMARY}
          strokeWidth={2.25}
          fill="url(#salesFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, stroke: "white" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function VisitsByDayChart({ data }: { data: { day: string; visits: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fill: AXIS, fontSize: 12 }}
          tickMargin={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: AXIS, fontSize: 12 }}
          width={32}
          tickFormatter={(v) => formatNumber(v as number)}
        />
        <Tooltip
          cursor={{ fill: "hsl(240 16% 96%)" }}
          content={<ChartTooltip formatter={(v) => `${formatNumber(v)} diners`} />}
        />
        <Bar dataKey="visits" fill={PRIMARY} radius={[6, 6, 0, 0]} maxBarSize={44} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Money-model colors — kept in sync with the metric-card tones.
const SUCCESS = "hsl(152 56% 38%)";
const WARNING = "hsl(38 92% 50%)";
const ROSE = "hsl(0 72% 51%)";

const STACK_ROWS: { key: "kept" | "paidBack" | "cost"; label: string; color: string }[] = [
  { key: "cost", label: "Your cost", color: ROSE },
  { key: "paidBack", label: "Paid back (passes through)", color: WARNING },
  { key: "kept", label: "You keep", color: SUCCESS },
];

function StackTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey?: string | number; value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const get = (k: string) => payload.find((p) => p.dataKey === k)?.value ?? 0;
  const total = get("kept") + get("paidBack") + get("cost");
  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1.5 font-medium text-foreground">{label}</p>
      {STACK_ROWS.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: r.color }} />
            {r.label}
          </span>
          <span className="tabular text-foreground">{formatCentsWhole(get(r.key))}</span>
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-border pt-1.5">
        <span className="text-muted-foreground">Sales</span>
        <span className="tabular font-medium text-foreground">{formatCentsWhole(total)}</span>
      </div>
    </div>
  );
}

export function CostEarningsChart({
  data,
}: {
  data: { day: string; kept: number; paidBack: number; cost: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }} barCategoryGap="24%">
        <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={{ fill: AXIS, fontSize: 12 }}
          tickMargin={10}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: AXIS, fontSize: 12 }}
          width={52}
          tickFormatter={(v) => formatCentsWhole(v as number)}
        />
        <Tooltip cursor={{ fill: "hsl(240 16% 96%)" }} content={<StackTooltip />} />
        <Bar dataKey="kept" stackId="a" fill={SUCCESS} maxBarSize={40} />
        <Bar dataKey="paidBack" stackId="a" fill={WARNING} maxBarSize={40} />
        <Bar dataKey="cost" stackId="a" fill={ROSE} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
