import { InfoTip } from "@/components/info-tip";
import { cn } from "@/lib/utils";
import { formatCentsOrDash } from "@/lib/format";

const FIELDS = [
  { key: "sales", label: "Sales", tooltip: "Total spend from tables that came through Bond.", accent: "text-foreground" },
  { key: "owed", label: "Paid Back", tooltip: "Cash your diners got back, funded by their own spend — settled through Bond, not a fee on your sales.", accent: "text-warning-foreground" },
  { key: "trueCost", label: "True Cost", tooltip: "Your real cost to fund paybacks, based on item cost.", accent: "text-destructive" },
  { key: "kept", label: "Kept", tooltip: "What you keep after paybacks and cost.", accent: "text-success" },
] as const;

export function MoneyStats({
  salesCents,
  owedCents,
  trueCostCents,
  keptCents,
  className,
}: {
  salesCents: number | null;
  owedCents: number | null;
  trueCostCents: number | null;
  keptCents: number | null;
  className?: string;
}) {
  const values: Record<string, number | null> = {
    sales: salesCents,
    owed: owedCents,
    trueCost: trueCostCents,
    kept: keptCents,
  };
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {FIELDS.map((f) => (
        <div key={f.key} className="rounded-lg border border-border/70 bg-secondary/30 p-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{f.label}</span>
            <InfoTip label={f.tooltip} />
          </div>
          <p className={cn("mt-1 text-lg font-semibold tracking-tight tabular", f.accent)}>
            {formatCentsOrDash(values[f.key])}
          </p>
        </div>
      ))}
    </div>
  );
}
