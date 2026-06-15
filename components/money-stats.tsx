import { InfoTip } from "@/components/info-tip";
import { cn } from "@/lib/utils";
import { formatCentsOrDash } from "@/lib/format";

/**
 * Money model for a ticket / period. Kept = Sales − Paid Back. True Cost is the
 * COGS *inside* the payback — shown as a note on Paid Back, NOT subtracted again.
 */
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
  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}>
      <Stat
        label="Sales"
        tooltip="Total spend from tables that came through Bond."
        value={salesCents}
        accent="text-foreground"
      />
      <Stat
        label="Paid Back"
        tooltip="Cash your diners got back, funded by their own spend — settled through Bond, not a fee on your sales."
        value={owedCents}
        accent="text-warning-foreground"
        sub={
          trueCostCents != null
            ? `only ${formatCentsOrDash(trueCostCents)} real cost to you`
            : "set cost-to-make to see your real cost"
        }
      />
      <Stat
        label="Kept"
        tooltip="Sales minus what you paid back. This is before your own food cost, so it isn't pure profit."
        value={keptCents}
        accent="text-success"
      />
    </div>
  );
}

function Stat({
  label,
  tooltip,
  value,
  accent,
  sub,
}: {
  label: string;
  tooltip: string;
  value: number | null;
  accent: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/30 p-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <InfoTip label={tooltip} />
      </div>
      <p className={cn("mt-1 text-lg font-semibold tracking-tight tabular", accent)}>
        {formatCentsOrDash(value)}
      </p>
      {sub ? <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
