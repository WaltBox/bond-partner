"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { InfoTip } from "@/components/info-tip";
import { PeriodToggle } from "@/components/dashboard/period-toggle";
import { cn } from "@/lib/utils";
import { formatCentsWhole } from "@/lib/format";
import type { Period } from "@/lib/api";

type Tone = "primary" | "emerald";

const TONE: Record<Tone, { icon: string; ring: string }> = {
  primary: { icon: "bg-primary/10 text-primary", ring: "ring-primary/20" },
  emerald: { icon: "bg-success/10 text-success", ring: "ring-success/20" },
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
    <Card className={cn("p-5", highlight && "ring-1", highlight && t.ring)}>
      <div className="flex items-center justify-between">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", t.icon)}>
          <Icon className="size-[18px]" />
        </div>
        <PeriodToggle value={period} onChange={setPeriod} />
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <InfoTip label={tooltip} />
      </div>

      {value == null ? (
        nullPrompt ? (
          <Link
            href={nullPrompt.href}
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {nullPrompt.text}
            <ArrowRight className="size-3.5" />
          </Link>
        ) : (
          <p className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-muted-foreground">—</p>
        )
      ) : (
        <p className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-foreground tabular">
          {formatCentsWhole(value)}
        </p>
      )}
    </Card>
  );
}
