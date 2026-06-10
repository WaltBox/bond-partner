import Link from "next/link";
import { Sparkles, TrendingUp, ArrowLeftRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCentsWhole } from "@/lib/format";

/**
 * AI note — plain-language breakdown templated from the live numbers. Falls back
 * to a "set cost-to-make" variant when real cost isn't known yet.
 */
export function AiNote({
  salesDrivenCents,
  paidBackCents,
  trueCostCents,
  roi,
}: {
  salesDrivenCents: number;
  paidBackCents: number;
  trueCostCents: number | null;
  roi: number | null;
}) {
  const known = trueCostCents != null;

  return (
    <Card className="mt-4 overflow-hidden border-primary/15 bg-gradient-to-br from-primary/[0.05] to-transparent">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-[18px]" />
          </div>
          <div className="max-w-2xl space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">AI note</span>
              <span className="text-[11px] text-muted-foreground">What this actually costs you</span>
            </div>

            {known ? (
              <p className="text-[15px] leading-relaxed text-foreground">
                Your real cost was about{" "}
                <strong className="font-semibold">{formatCentsWhole(trueCostCents!)}</strong> — the
                food in the items you comped. Your diners already paid for those items, so the{" "}
                <strong className="font-semibold">{formatCentsWhole(paidBackCents)}</strong> in
                paybacks is just their own spend cycling back to them through Bond. That{" "}
                {formatCentsWhole(trueCostCents!)} drove{" "}
                <strong className="font-semibold text-primary">{formatCentsWhole(salesDrivenCents)}</strong>{" "}
                in sales.
              </p>
            ) : (
              <p className="text-[15px] leading-relaxed text-foreground">
                The <strong className="font-semibold">{formatCentsWhole(paidBackCents)}</strong> in
                paybacks is your diners&apos; own spend cycling back to them through Bond — and it
                drove{" "}
                <strong className="font-semibold text-primary">{formatCentsWhole(salesDrivenCents)}</strong>{" "}
                in sales.{" "}
                <Link href="/settings" className="font-medium text-primary hover:underline">
                  Set your cost-to-make
                </Link>{" "}
                to see what it actually cost you.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1">
                <ArrowLeftRight className="size-3.5" />
                Paid back {formatCentsWhole(paidBackCents)} — diner-funded, passes through
              </span>
              {known ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1">
                  Your real cost ≈ {formatCentsWhole(trueCostCents!)} — food you comped
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {roi != null ? (
          <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-primary/20 bg-card px-4 py-2.5 lg:self-center">
            <TrendingUp className="size-5 text-primary" />
            <div className="leading-tight">
              <p className="text-lg font-semibold tracking-tight text-foreground tabular">
                ${roi.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">in sales per $1 of paybacks</p>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
