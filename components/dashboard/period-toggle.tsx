"use client";

import { cn } from "@/lib/utils";
import type { Period } from "@/lib/api";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "this_month", label: "Monthly" },
  { value: "all_time", label: "All time" },
];

/** Compact segmented control that lives in a metric card's corner so each
 *  metric can be filtered independently (per-column, not globally). */
export function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-secondary/50 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
