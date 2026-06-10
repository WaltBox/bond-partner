import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { formatCents, formatNumber, formatPercent } from "@/lib/format";

export function InsightsCard({
  insights,
}: {
  insights: {
    totalDiners: number;
    repeatRate: number;
    avgPartySize: number;
    avgTicketCents: number;
    newVsReturning: { new: number; returning: number };
  };
}) {
  const { totalDiners, repeatRate, avgPartySize, avgTicketCents, newVsReturning } = insights;
  const total = newVsReturning.new + newVsReturning.returning || 1;
  const newPct = (newVsReturning.new / total) * 100;

  const stats = [
    { label: "Total diners", value: formatNumber(totalDiners) },
    { label: "Repeat-visit rate", value: formatPercent(repeatRate) },
    { label: "Avg party size", value: avgPartySize.toFixed(1) },
    { label: "Avg ticket size", value: formatCents(avgTicketCents) },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Diner insights</CardTitle>
        <Badge variant="muted" className="font-normal">
          <ShieldCheck className="size-3.5" />
          Privacy-safe
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-foreground tabular">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">New vs Returning</span>
            <span className="text-muted-foreground tabular">
              {formatNumber(newVsReturning.new)} new · {formatNumber(newVsReturning.returning)} returning
            </span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary" style={{ width: `${newPct}%` }} aria-hidden />
            <div className="h-full bg-success" style={{ width: `${100 - newPct}%` }} aria-hidden />
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" /> New
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-success" /> Returning
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Counts only — Bond never shares diner names or personal details with partners.
        </p>
      </CardContent>
    </Card>
  );
}
