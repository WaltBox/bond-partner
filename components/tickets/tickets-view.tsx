"use client";

import * as React from "react";
import { ChevronRight, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { SourceTag } from "@/components/source-tag";
import { TicketDetailPanel } from "@/components/tickets/ticket-detail-panel";
import { getTickets, type Badge as TicketBadge, type SourceType, type TicketListItem } from "@/lib/api";
import { useAsync } from "@/lib/api/use-async";
import { formatCentsOrDash, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ALL = "all";

export function TicketsView() {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [source, setSource] = React.useState<string>(ALL);
  const [badge, setBadge] = React.useState<string>(ALL);
  const [withReceipt, setWithReceipt] = React.useState<string>(ALL);

  // Resizable drawer — drag the left edge to widen it.
  const [drawerWidth, setDrawerWidth] = React.useState(640);
  const draggingRef = React.useRef(false);
  React.useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const w = Math.min(Math.max(window.innerWidth - e.clientX, 420), window.innerWidth - 32);
      setDrawerWidth(w);
    };
    const up = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  };

  const filters = React.useMemo(
    () => ({
      source: source === ALL ? undefined : (source as SourceType),
      badge: badge === ALL ? undefined : (badge as TicketBadge),
      withReceipt: withReceipt === "yes" ? true : undefined,
    }),
    [source, badge, withReceipt]
  );

  const { data, loading, error, reload } = useAsync(() => getTickets(filters), [filters]);

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterSelect value={source} onChange={setSource} label="Source" allLabel="All sources" options={[["promo", "Perks"], ["super_perk", "Super Perks"]]} />
        <FilterSelect value={badge} onChange={setBadge} label="Status" allLabel="All statuses" options={[["redeemed", "Redeemed"], ["pending_review", "Pending review"], ["disputed", "Disputed"], ["expired", "Expired"]]} />
        <FilterSelect value={withReceipt} onChange={setWithReceipt} label="Receipt" allLabel="All tickets" options={[["yes", "With receipt only"]]} />
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Party</TableHead>
              <TableHead>Offer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Paid Back</TableHead>
              <TableHead className="text-right">True Cost</TableHead>
              <TableHead className="text-right">Kept</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell colSpan={10}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10}>
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <AlertCircle className="size-6 text-destructive" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button variant="outline" size="sm" onClick={reload}>
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : !data || data.tickets.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10}>
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No tickets match these filters.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              data.tickets.map((t: TicketListItem) => (
                <TableRow
                  key={t.redemptionId}
                  onClick={() => setSelected(t.redemptionId)}
                  className="group cursor-pointer"
                >
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    {formatDateTime(t.createdAt)}
                  </TableCell>
                  <TableCell>
                    <SourceTag type={t.sourceType} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground tabular">
                    {t.partySize} diners
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {t.offerName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={t.badge} />
                  </TableCell>
                  <TableCell className="text-right tabular font-medium text-foreground">
                    {formatCentsOrDash(t.salesCents)}
                  </TableCell>
                  <TableCell className="text-right tabular text-warning-foreground">
                    {formatCentsOrDash(t.owedCents)}
                  </TableCell>
                  <TableCell className="text-right tabular text-destructive">
                    {formatCentsOrDash(t.trueCostCents)}
                  </TableCell>
                  <TableCell className="text-right tabular font-semibold text-success">
                    {formatCentsOrDash(t.keptCents)}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {data ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {data.tickets.length} of {data.total} tickets
        </p>
      ) : null}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          style={{ width: `${drawerWidth}px`, maxWidth: "96vw" }}
          className={cn("overflow-y-auto p-6 pt-14 sm:p-8 sm:pt-14")}
        >
          {/* Drag handle to resize */}
          <div
            onPointerDown={startResize}
            className="group absolute inset-y-0 left-0 z-30 hidden w-2.5 cursor-col-resize items-center justify-center sm:flex"
            title="Drag to resize"
          >
            <div className="h-12 w-1 rounded-full bg-border transition-colors group-hover:bg-muted-foreground/60" />
          </div>
          {selected ? <TicketDetailPanel redemptionId={selected} /> : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  allLabel: string;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-[150px]" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
