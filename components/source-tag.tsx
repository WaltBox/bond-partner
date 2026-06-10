import { Zap, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceType } from "@/lib/api";

const base =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium shadow-sm shadow-black/[0.02]";

/** Perk / Super Perk tag, shared across the tickets table and drawer. */
export function SourceTag({ type }: { type: SourceType }) {
  if (type === "super_perk") {
    return (
      <span className={cn(base, "border-amber-200 bg-amber-50 text-amber-700")}>
        <Zap className="size-3" />
        Super Perk
      </span>
    );
  }
  return (
    <span className={cn(base, "border-border bg-card text-foreground")}>
      <Tag className="size-3 text-muted-foreground" />
      Perk
    </span>
  );
}
