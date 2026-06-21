"use client";

import { DollarSign, Wallet, BarChart3, Users, Zap, Tag, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FilterableMetricCard } from "@/components/dashboard/filterable-metric-card";
import { SalesTrendCard } from "@/components/dashboard/sales-trend-card";
import { PaybackFlow } from "@/components/dashboard/payback-flow";
import { MomentsPreview } from "@/components/dashboard/moments-preview";
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

          {/* What diners are posting */}
          <MomentsPreview />

          {/* Sales over time — derived from tickets */}
          <SalesTrendCard />

          {/* Perks vs Super Perks split */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SourceCard
              label="Perks"
              icon={<Tag className="size-[18px]" />}
              chip="#FF85B8"
              data={tm.data.bySource.promo}
            />
            <SourceCard
              label="Super Perks"
              icon={<Zap className="size-[18px]" />}
              chip="#FFC93C"
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
  chip,
  data,
}: {
  label: string;
  icon: React.ReactNode;
  chip: string;
  data: SourceBreakdown;
}) {
  return (
    <div className="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-5 shadow-[4px_4px_0_0_#1a1a1a] transition-all duration-150 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_#1a1a1a]">
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-9 items-center justify-center rounded-full border-[2.5px] border-[#1a1a1a] text-[#1a1a1a] shadow-[2.5px_2.5px_0_0_#1a1a1a]"
          style={{ backgroundColor: chip }}
        >
          {icon}
        </span>
        <p className="font-display text-base font-bold text-[#1a1a1a]">{label}</p>
        <span className="ml-auto rounded-full border-[2px] border-[#1a1a1a] bg-white px-2 py-0.5 text-xs font-bold text-[#1a1a1a] tabular">
          {data.ticketCount} tickets
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-[#1a1a1a]/55">Sales driven</p>
          <p className="mt-0.5 font-display text-xl font-extrabold text-[#1a1a1a] tabular">
            {formatCentsWhole(data.salesCents)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#1a1a1a]/55">Paid back</p>
          <p className="mt-0.5 font-display text-xl font-extrabold text-[#1a1a1a] tabular">
            {formatCentsWhole(data.owedCents)}
          </p>
        </div>
      </div>
    </div>
  );
}
