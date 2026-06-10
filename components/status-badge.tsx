import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/lib/data";

const CONFIG: Record<TicketStatus, { label: string; dot: string }> = {
  redeemed: { label: "Redeemed", dot: "bg-emerald-500" },
  pending_review: { label: "Pending review", dot: "bg-amber-500" },
  disputed: { label: "Disputed", dot: "bg-rose-500" },
  expired: { label: "Expired", dot: "bg-slate-400" },
};

export function StatusBadge({ status, className }: { status: TicketStatus; className?: string }) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground shadow-sm shadow-black/[0.02]",
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", c.dot)} aria-hidden />
      {c.label}
    </span>
  );
}
