"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { InfoTip } from "@/components/info-tip";
import { PeriodToggle } from "@/components/dashboard/period-toggle";
import { cn } from "@/lib/utils";
import { formatCentsWhole } from "@/lib/format";
import type { Period } from "@/lib/api";

type Tone = "primary" | "emerald";

/** Bond 3D sticker palette — bright tone block + chip color per metric. */
const TONE: Record<Tone, { bg: string; chip: string }> = {
  primary: { bg: "#D4DEFF", chip: "#7B8FE8" }, // sales — bond blue
  emerald: { bg: "#E8FBEA", chip: "#5DD96E" }, // kept — bond green
};

/** Metric card with its own Monthly / All-time toggle. Renders a prompt when
 *  the value is null (e.g. Kept before cost-to-make is set). */
export function FilterableMetricCard({
  label,
  tooltip,
  thisMonthCents,
  allTimeCents,
  icon: Icon,
  tone,
  highlight = false,
  nullPrompt,
}: {
  label: string;
  tooltip: string;
  thisMonthCents: number | null;
  allTimeCents: number | null;
  icon: LucideIcon;
  tone: Tone;
  highlight?: boolean;
  nullPrompt?: { text: string; href: string };
}) {
  const [period, setPeriod] = React.useState<Period>("this_month");
  const value = period === "this_month" ? thisMonthCents : allTimeCents;
  const t = TONE[tone];

  return (
    <div
      className={cn(
        "group relative rounded-2xl border-[2.5px] border-[#1a1a1a] p-5",
        "shadow-[4px_4px_0_0_#1a1a1a] transition-all duration-150",
        "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0_0_#1a1a1a]"
      )}
      style={{ backgroundColor: t.bg }}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex size-10 items-center justify-center rounded-full border-[2.5px] border-[#1a1a1a] text-white shadow-[2.5px_2.5px_0_0_#1a1a1a]"
          style={{ backgroundColor: t.chip }}
        >
          <Icon className="size-[19px]" />
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <p className="text-sm font-bold text-[#1a1a1a]/70">{label}</p>
        <InfoTip label={tooltip} />
      </div>

      {value == null ? (
        nullPrompt ? (
          <Link
            href={nullPrompt.href}
            className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-[#1a1a1a] underline-offset-2 hover:underline"
          >
            {nullPrompt.text}
            <ArrowRight className="size-3.5" />
          </Link>
        ) : (
          <p className="mt-1 font-display text-[32px] font-extrabold leading-tight tracking-tight text-[#1a1a1a]/40">—</p>
        )
      ) : (
        <p className="mt-1 font-display text-[34px] font-extrabold leading-none tracking-[-0.02em] text-[#1a1a1a] tabular">
          {formatCentsWhole(value)}
        </p>
      )}
    </div>
  );
}
