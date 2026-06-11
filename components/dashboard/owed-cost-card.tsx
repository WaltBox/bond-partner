import Link from "next/link";
import { HandCoins, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTip } from "@/components/info-tip";
import { formatCentsWhole } from "@/lib/format";

/** Fixed "what you owe" card — no time toggle, because a bill is always the
 *  current month. Combines Owed to Bond with the real-cost / pass-through split.
 *  realCostCents is null until cost-to-make is set in Settings. */
export function OwedCostCard({
  owedCents,
  realCostCents,
}: {
  owedCents: number;
  realCostCents: number | null;
}) {
  const passThrough = realCostCents == null ? null : Math.max(0, owedCents - realCostCents);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex size-9 items-center justify-center rounded-lg bg-warning/15 text-warning-foreground">
          <HandCoins className="size-[18px]" />
        </div>
        <Badge variant="muted" className="font-normal">
          This month
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <p className="text-sm font-medium text-muted-foreground">Paid Back</p>
        <InfoTip label="Cash your diners got back this period, funded by their own spend. You settle it with Bond monthly — it's not a fee on your sales." />
      </div>
      <p className="mt-1 font-display text-[27px] font-extrabold leading-tight tracking-tight text-foreground tabular">
        {formatCentsWhole(owedCents)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/70 pt-3.5">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">Real cost to you</p>
            <InfoTip label="What it actually cost you to deliver the paybacks — the cost of the items you comped. Set cost-to-make in Settings to see this." />
          </div>
          {realCostCents == null ? (
            <Link
              href="/settings"
              className="mt-0.5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Set cost-to-make
              <ArrowRight className="size-3.5" />
            </Link>
          ) : (
            <p className="mt-0.5 text-base font-semibold text-foreground tabular">
              {formatCentsWhole(realCostCents)}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Passes back to diners</p>
          <p className="mt-0.5 text-base font-semibold text-muted-foreground tabular">
            {passThrough == null ? "—" : formatCentsWhole(passThrough)}
          </p>
        </div>
      </div>
    </Card>
  );
}
