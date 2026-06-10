import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CostEarningsChart } from "@/components/dashboard/charts";
import { formatCentsWhole } from "@/lib/format";

/**
 * Cost vs. earnings — visualizes the Sales = Kept + Paid Back + Cost identity.
 * Left: daily stacked bars. Right: the period total as a 100% composition bar,
 * making it obvious the paid-back slice is diner-funded pass-through and the
 * real cost is a sliver.
 */
export function CostEarnings({
  salesDrivenCents,
  paidBackCents,
  trueCostCents,
  keptCents,
  daily,
}: {
  salesDrivenCents: number;
  paidBackCents: number;
  trueCostCents: number;
  keptCents: number;
  daily: { day: string; kept: number; paidBack: number; cost: number }[];
}) {
  const total = salesDrivenCents || 1;
  const segments = [
    { key: "kept", label: "You keep", note: "after paybacks & cost", cents: keptCents, bar: "bg-success", dot: "bg-success" },
    { key: "paidBack", label: "Paid back", note: "diner-funded · passes through", cents: paidBackCents, bar: "bg-warning", dot: "bg-warning" },
    { key: "cost", label: "Your cost", note: "food you comped", cents: trueCostCents, bar: "bg-destructive", dot: "bg-destructive" },
  ];

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Cost vs. earnings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Every Bond sale, split into what you keep, what passes back, and what it costs
          </p>
        </CardHeader>
        <CardContent>
          <CostEarningsChart data={daily} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Where your sales go</CardTitle>
          <p className="text-sm text-muted-foreground">{formatCentsWhole(total)} driven this period</p>
        </CardHeader>
        <CardContent>
          {/* 100% composition bar */}
          <div className="flex h-3.5 w-full overflow-hidden rounded-full">
            {segments.map((s) => (
              <div
                key={s.key}
                className={s.bar}
                style={{ width: `${(s.cents / total) * 100}%` }}
                title={`${s.label} — ${formatCentsWhole(s.cents)}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="mt-5 space-y-3.5">
            {segments.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`size-2.5 shrink-0 rounded-full ${s.dot}`} />
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-foreground">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.note}</p>
                  </div>
                </div>
                <div className="text-right leading-tight">
                  <p className="text-sm font-semibold text-foreground tabular">{formatCentsWhole(s.cents)}</p>
                  <p className="text-xs text-muted-foreground tabular">
                    {Math.round((s.cents / total) * 100)}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-warning/25 bg-warning/[0.06] p-3 text-xs leading-relaxed text-foreground">
            The amber slice <strong className="font-semibold">passes through</strong> — it&apos;s your
            diners&apos; own spend returned to them. Only the rose sliver (
            <strong className="font-semibold">{formatCentsWhole(trueCostCents)}</strong>) is real cost
            to you.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
