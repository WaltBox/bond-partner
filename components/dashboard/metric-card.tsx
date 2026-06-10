import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { InfoTip } from "@/components/info-tip";
import { cn } from "@/lib/utils";
import { formatDelta } from "@/lib/format";

type Tone = "primary" | "amber" | "rose" | "emerald";

const TONE: Record<Tone, { icon: string; ring: string }> = {
  primary: { icon: "bg-primary/10 text-primary", ring: "ring-primary/20" },
  amber: { icon: "bg-warning/15 text-warning-foreground", ring: "ring-warning/20" },
  rose: { icon: "bg-destructive/10 text-destructive", ring: "ring-destructive/20" },
  emerald: { icon: "bg-success/10 text-success", ring: "ring-success/20" },
};

export function MetricCard({
  label,
  tooltip,
  value,
  delta,
  goodWhen,
  icon: Icon,
  tone,
  highlight = false,
  showDelta = true,
  caption,
}: {
  label: string;
  tooltip: string;
  value: string;
  delta: number;
  goodWhen: "up" | "down";
  icon: LucideIcon;
  tone: Tone;
  highlight?: boolean;
  showDelta?: boolean;
  caption?: string;
}) {
  const up = delta >= 0;
  const isGood = (up && goodWhen === "up") || (!up && goodWhen === "down");
  const DeltaIcon = up ? ArrowUpRight : ArrowDownRight;
  const t = TONE[tone];

  return (
    <Card className={cn("p-5", highlight && "ring-1", highlight && t.ring)}>
      <div className="flex items-center justify-between">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", t.icon)}>
          <Icon className="size-[18px]" />
        </div>
        {showDelta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular",
              isGood ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
            title="vs. previous period"
          >
            <DeltaIcon className="size-3" />
            {formatDelta(delta)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <InfoTip label={tooltip} />
      </div>
      <p className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-foreground tabular">
        {value}
      </p>
      {caption ? <p className="mt-1 text-xs text-muted-foreground">{caption}</p> : null}
    </Card>
  );
}
