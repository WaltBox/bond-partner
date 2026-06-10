"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SalesOverTimeChart } from "@/components/dashboard/charts";
import { getTickets } from "@/lib/api";
import { useAsync } from "@/lib/api/use-async";
import { formatCentsWhole } from "@/lib/format";
import { cn } from "@/lib/utils";

const MS_DAY = 86_400_000;
const RANGES: { value: string; short: string; days: number | null }[] = [
  { value: "7d", short: "7D", days: 7 },
  { value: "30d", short: "30D", days: 30 },
  { value: "90d", short: "90D", days: 90 },
  { value: "all", short: "All", days: null },
];

const floorDay = (ts: number) => {
  const d = new Date(ts);
  d.setUTCHours(0, 0, 0, 0);
  return d.getTime();
};

/** Real "Sales over time", derived from the tickets list (no time-series
 *  endpoint yet). Date range is filterable; the window is anchored to the data's
 *  dates, not the browser clock. */
export function SalesTrendCard() {
  const { data, loading, error, reload } = useAsync(() => getTickets({ limit: 200 }), []);
  const [range, setRange] = React.useState("30d");

  const view = React.useMemo(() => {
    if (!data) return null;
    const tickets = data.tickets;
    const dates = tickets.map((t) => Date.parse(t.createdAt)).filter((n) => !Number.isNaN(n));
    const maxTs = dates.length ? Math.max(...dates) : Date.now();
    const minTs = dates.length ? Math.min(...dates) : maxTs;

    const cfg = RANGES.find((r) => r.value === range) ?? RANGES[1];
    const end = floorDay(maxTs);
    const start = cfg.days == null ? floorDay(minTs) : end - (cfg.days - 1) * MS_DAY;

    const buckets = new Map<string, number>();
    for (let ts = start; ts <= end; ts += MS_DAY) {
      buckets.set(new Date(ts).toISOString().slice(0, 10), 0);
    }

    let ticketsInWindow = 0;
    let receiptsInWindow = 0;
    for (const t of tickets) {
      const ts = floorDay(Date.parse(t.createdAt));
      if (ts < start || ts > end) continue;
      ticketsInWindow++;
      if (t.salesCents != null) {
        receiptsInWindow++;
        const key = new Date(ts).toISOString().slice(0, 10);
        buckets.set(key, (buckets.get(key) ?? 0) + t.salesCents);
      }
    }

    const series = Array.from(buckets.entries(), ([iso, cents]) => ({
      day: new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
      cents,
    }));

    return {
      series,
      total: series.reduce((s, p) => s + p.cents, 0),
      ticketsInWindow,
      receiptsInWindow,
    };
  }, [data, range]);

  return (
    <Card className="mt-4">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Sales over time</CardTitle>
          <p className="text-sm text-muted-foreground">Bond-driven sales from scanned receipts</p>
        </div>
        <div className="flex items-center gap-3">
          {view ? (
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-lg font-semibold tracking-tight text-foreground tabular">
                {formatCentsWhole(view.total)}
              </p>
              <p className="text-xs text-muted-foreground">in range</p>
            </div>
          ) : null}
          {/* Date range filter */}
          <div className="inline-flex items-center rounded-lg border border-border bg-secondary/50 p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                aria-pressed={range === r.value}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  range === r.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.short}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="size-6 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={reload}>
              Try again
            </Button>
          </div>
        ) : view ? (
          <>
            <SalesOverTimeChart data={view.series} />
            <p className="mt-2 text-xs text-muted-foreground">
              Only tickets with a scanned receipt count toward sales — {view.receiptsInWindow} of{" "}
              {view.ticketsInWindow} in this range.
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
