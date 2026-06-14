"use client";

import * as React from "react";
import {
  Calendar,
  Users,
  ImageIcon,
  ScanLine,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { SourceTag } from "@/components/source-tag";
import { MoneyStats } from "@/components/money-stats";
import { DisputeDialog } from "@/components/tickets/dispute-dialog";
import { getTicket } from "@/lib/api";
import { useAsync } from "@/lib/api/use-async";
import { formatCents, formatCentsOrDash, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TicketDetailPanel({ redemptionId }: { redemptionId: string }) {
  const { data: d, loading, error } = useAsync(() => getTicket(redemptionId), [redemptionId]);

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="size-7 text-destructive" />
        <p className="text-sm text-muted-foreground">{error ?? "Ticket not found"}</p>
      </div>
    );
  }

  // Expand each line item into individual units — the first `paidBackQty` units
  // of a line are the ones that were comped.
  const units = d.lineItems.flatMap((li, idx) =>
    Array.from({ length: Math.max(1, li.qty) }, (_, i) => ({
      key: `${idx}-${i}`,
      name: li.name,
      amountCents: li.unitCents,
      qualifies: li.qualifies,
      paidBack: li.paidBack && i < li.paidBackQty,
    }))
  );
  const qualifyingCount = units.filter((u) => u.qualifies).length;
  const paidBackCount = units.filter((u) => u.paidBack).length;

  // Receipt images for the carousel: the per-person receipts when present
  // (separate checks), otherwise the single combined receipt.
  const receiptViews =
    d.receipts && d.receipts.length > 0
      ? d.receipts.map((r) => ({ imageUrl: r.imageUrl, totalCents: r.totalCents }))
      : [{ imageUrl: d.receiptImageUrl ?? null, totalCents: d.receiptTotalCents }];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{d.redemptionId}</h2>
          <StatusBadge status={d.badge} />
          <SourceTag type={d.sourceType} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-4" />
            {formatDateTime(d.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" />
            {d.party.total} diners
          </span>
        </div>
        {d.offerName ? (
          <Badge variant="default" className="font-normal">
            {d.offerName}
          </Badge>
        ) : null}
      </div>

      <MoneyStats
        salesCents={d.salesCents}
        owedCents={d.owedCents}
        trueCostCents={d.trueCostCents}
        keptCents={d.keptCents}
      />

      <Separator />

      {/* Receipt(s) + combined ledger */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_1fr]">
        <ReceiptColumn
          views={receiptViews}
          available={d.receiptImageAvailable}
          alt={d.redemptionId}
        />

        <div>
          <div className="mb-2 flex items-center gap-2">
            <ScanLine className="size-4 text-primary" />
            <p className="text-sm font-medium text-foreground">AI-parsed itemized ledger</p>
          </div>
          {d.lineItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
              No receipt scanned for this ticket yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((u) => (
                    <TableRow
                      key={u.key}
                      className={cn(u.paidBack && "bg-accent/60 hover:bg-accent")}
                    >
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">{u.name}</span>
                          {u.paidBack ? (
                            <Badge variant="default" className="font-normal">
                              Paid back
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular font-medium text-foreground">
                        {formatCentsOrDash(u.amountCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {d.taxCents != null ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="text-muted-foreground">Tax</TableCell>
                      <TableCell className="text-right tabular text-muted-foreground">
                        {formatCents(d.taxCents)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {d.tipCents != null ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="text-muted-foreground">Tip</TableCell>
                      <TableCell className="text-right tabular text-muted-foreground">
                        {formatCents(d.tipCents)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="font-semibold text-foreground">Total</TableCell>
                    <TableCell className="text-right tabular font-semibold text-foreground">
                      {formatCentsOrDash(d.receiptTotalCents)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {paidBackCount > 0
              ? `Paid back ${paidBackCount} of ${qualifyingCount} qualifying ${
                  qualifyingCount === 1 ? "item" : "items"
                } — the cheapest qualify first, highlighted above. `
              : qualifyingCount > 0
                ? `${qualifyingCount} qualifying ${
                    qualifyingCount === 1 ? "item" : "items"
                  } on this receipt; none paid back this visit. `
                : ""}
            Parsed automatically from the receipt.
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Something look off? Open a dispute and Bond will review it.
        </p>
        <DisputeDialog ticketId={d.redemptionId} />
      </div>
    </div>
  );
}

/** Scanned-receipt panel. One image for single payer; a carousel when a
 *  separate-checks redemption has multiple receipts. Layout is unchanged. */
function ReceiptColumn({
  views,
  available,
  alt,
}: {
  views: { imageUrl: string | null; totalCents: number | null }[];
  available: boolean;
  alt: string;
}) {
  const [i, setI] = React.useState(0);
  const n = views.length;
  const idx = Math.min(i, n - 1);
  const cur = views[idx];
  const go = (delta: number) => setI((p) => (((p + delta) % n) + n) % n);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">Scanned receipt</p>
      <div className="relative">
        {cur.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <a href={cur.imageUrl} target="_blank" rel="noreferrer" className="block">
            <img
              src={cur.imageUrl}
              alt={`Scanned receipt ${idx + 1} for ${alt}`}
              className="aspect-[3/4] w-full rounded-lg border border-border object-cover transition-opacity hover:opacity-90"
            />
          </a>
        ) : (
          <div className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/40 px-3 text-center text-muted-foreground">
            <ImageIcon className="size-7" />
            <span className="text-xs font-medium">
              {available ? "Receipt on file" : "No receipt scanned"}
            </span>
            {available ? (
              <span className="text-[11px] leading-snug text-muted-foreground/80">
                Image not exposed by the API yet
              </span>
            ) : null}
          </div>
        )}
        {n > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous receipt"
              className="absolute left-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-secondary"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next receipt"
              className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-secondary"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-foreground/70 px-2 py-0.5 text-[11px] font-medium text-background tabular">
              {idx + 1} / {n}
            </div>
          </>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground tabular">
        Printed total {formatCentsOrDash(cur.totalCents)}
      </p>
    </div>
  );
}
