import Link from "next/link";
import { Sparkles, TrendingUp, ArrowLeftRight } from "lucide-react";
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
    <div className="mt-4 overflow-hidden rounded-2xl border-[2.5px] border-[#1a1a1a] bg-[#FFF5E8] shadow-[4px_4px_0_0_#1a1a1a]">
      <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-[2.5px] border-[#1a1a1a] bg-[#FFC93C] text-[#1a1a1a] shadow-[2.5px_2.5px_0_0_#1a1a1a]">
            <Sparkles className="size-[18px]" />
          </div>
          <div className="max-w-2xl space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1a1a1a]">AI note</span>
              <span className="text-[11px] font-medium text-[#1a1a1a]/55">What this actually costs you</span>
            </div>

            {known ? (
              <p className="text-[15px] leading-relaxed text-[#1a1a1a]">
                Your real cost was about{" "}
                <strong className="font-bold">{formatCentsWhole(trueCostCents!)}</strong> — the
                food in the items you comped. Your diners already paid for those items, so the{" "}
                <strong className="font-bold">{formatCentsWhole(paidBackCents)}</strong> in
                paybacks is just their own spend cycling back to them through Bond. That{" "}
                {formatCentsWhole(trueCostCents!)} drove{" "}
                <strong className="font-extrabold">{formatCentsWhole(salesDrivenCents)}</strong>{" "}
                in sales.
              </p>
            ) : (
              <p className="text-[15px] leading-relaxed text-[#1a1a1a]">
                The <strong className="font-bold">{formatCentsWhole(paidBackCents)}</strong> in
                paybacks is your diners&apos; own spend cycling back to them through Bond — and it
                drove{" "}
                <strong className="font-extrabold">{formatCentsWhole(salesDrivenCents)}</strong>{" "}
                in sales.{" "}
                <Link href="/settings" className="font-bold underline underline-offset-2 hover:opacity-70">
                  Set your cost-to-make
                </Link>{" "}
                to see what it actually cost you.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 pt-1 text-xs font-semibold text-[#1a1a1a]/75">
              <span className="inline-flex items-center gap-1.5 rounded-full border-[2px] border-[#1a1a1a] bg-white px-2.5 py-1">
                <ArrowLeftRight className="size-3.5" />
                Paid back {formatCentsWhole(paidBackCents)} — diner-funded, passes through
              </span>
              {known ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border-[2px] border-[#1a1a1a] bg-white px-2.5 py-1">
                  Your real cost ≈ {formatCentsWhole(trueCostCents!)} — food you comped
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {roi != null ? (
          <div className="flex shrink-0 items-center gap-3 self-start rounded-2xl border-[2.5px] border-[#1a1a1a] bg-[#5DD96E] px-4 py-2.5 shadow-[3px_3px_0_0_#1a1a1a] lg:self-center">
            <TrendingUp className="size-5 text-[#1a1a1a]" />
            <div className="leading-tight">
              <p className="font-display text-xl font-extrabold tracking-tight text-[#1a1a1a] tabular">
                ${roi.toFixed(2)}
              </p>
              <p className="text-xs font-semibold text-[#1a1a1a]/70">in sales per $1 of paybacks</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
