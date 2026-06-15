"use client";

import { DollarSign, Wallet, BarChart3, Users, Zap, Tag, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FilterableMetricCard } from "@/components/dashboard/filterable-metric-card";
import { OwedCostCard } from "@/components/dashboard/owed-cost-card";
import { AiNote } from "@/components/dashboard/ai-note";
import { SalesTrendCard } from "@/components/dashboard/sales-trend-card";
import { PaybackFlow } from "@/components/dashboard/payback-flow";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getDashboard, type SourceBreakdown } from "@/lib/api";
import { useAsync } from "@/lib/api/use-async";
import { formatCentsWhole } from "@/lib/format";

export default function DashboardPage() {
  const tm = useAsync(() => getDashboard("this_month"), []);
  const at = useAsync(() => getDashboard("all_time"), []);

  const loading = tm.loading || at.loading;
  const error = tm.error || at.error;

  return (
    <div className="animate-fade-in">
      <PageHeader title="Dashboard" description="What Bond is driving for you" />

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="size-7 text-destructive" />
            <div>
              <p className="font-medium text-foreground">Couldn&apos;t load your dashboard</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                tm.reload();
                at.reload();
              }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : loading || !tm.data || !at.data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className="h-7 w-28 rounded-lg" />
              </div>
              <Skeleton className="mt-5 h-4 w-24" />
              <Skeleton className="mt-2 h-7 w-32" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Standard top section */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <FilterableMetricCard
              label="Sales Driven"
              tooltip="Total spend from tables that came through Bond."
              thisMonthCents={tm.data.salesDrivenCents}
              allTimeCents={at.data.salesDrivenCents}
              icon={DollarSign}
              tone="primary"
            />
            <OwedCostCard owedCents={tm.data.owedToBondCents} realCostCents={tm.data.trueCostCents} />
            <FilterableMetricCard
              label="Made from Bond"
              tooltip="Sales minus what you paid back. This is before your own food cost, so it isn't pure profit."
              thisMonthCents={tm.data.keptCents}
              allTimeCents={at.data.keptCents}
              icon={Wallet}
              tone="emerald"
              highlight
            />
          </div>

          {/* AI note */}
          <AiNote
            salesDrivenCents={tm.data.salesDrivenCents}
            paidBackCents={tm.data.owedToBondCents}
            trueCostCents={tm.data.trueCostCents}
            roi={tm.data.roi}
          />

          {/* Sales over time — derived from tickets */}
          <SalesTrendCard />

          {/* Perks vs Super Perks split */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SourceCard
              label="Perks"
              icon={<Tag className="size-4" />}
              data={tm.data.bySource.promo}
            />
            <SourceCard
              label="Super Perks"
              icon={<Zap className="size-4" />}
              data={tm.data.bySource.super_perk}
            />
          </div>

          {/* How a payback flows — collapsed behind a button */}
          <div className="mt-4">
            <PaybackFlow />
          </div>

          {/* Coming soon */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ComingSoon
              title="Cost vs. Earnings"
              icon={BarChart3}
              description="A visual breakdown of what you keep, what passes back, and what it costs — tracked over time."
            />
            <ComingSoon
              title="Diner Insights"
              icon={Users}
              description="Repeat-visit rate, party size, and new vs. returning — privacy-safe, counts only."
            />
          </div>
        </>
      )}
    </div>
  );
}

function SourceCard({
  label,
  icon,
  data,
}: {
  label: string;
  icon: React.ReactNode;
  data: SourceBreakdown;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          {icon}
        </span>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="ml-auto text-xs text-muted-foreground tabular">{data.ticketCount} tickets</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Sales driven</p>
          <p className="mt-0.5 text-base font-semibold text-foreground tabular">
            {formatCentsWhole(data.salesCents)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Paid back</p>
          <p className="mt-0.5 text-base font-semibold text-foreground tabular">
            {formatCentsWhole(data.owedCents)}
          </p>
        </div>
      </div>
    </Card>
  );
}
