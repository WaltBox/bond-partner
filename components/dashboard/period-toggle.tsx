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
    <div className="inline-flex items-center rounded-full border-[2px] border-[#1a1a1a] bg-white/70 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors focus:outline-none",
            value === opt.value
              ? "bg-[#1a1a1a] text-white"
              : "text-[#1a1a1a]/60 hover:text-[#1a1a1a]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
