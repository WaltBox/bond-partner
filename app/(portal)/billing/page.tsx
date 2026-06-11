"use client";

import * as React from "react";
import { Download, FileText, FileSpreadsheet, Info, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/page-header";
import { InfoTip } from "@/components/info-tip";
import { getTickets } from "@/lib/api";
import { useAsync } from "@/lib/api/use-async";
import { formatCents, formatCentsWhole, formatDateTime } from "@/lib/format";

export default function BillingPage() {
  const { data, loading, error, reload } = useAsync(() => getTickets({ limit: 200 }), []);
  const [pdfNote, setPdfNote] = React.useState(false);

  // Derive the statement from real tickets (no billing endpoint yet).
  const lines = React.useMemo(() => {
    const rows = (data?.tickets ?? []).map((t) => ({
      id: t.redemptionId,
      date: t.createdAt,
      promo: t.offerName ?? "—",
      owedCents: t.owedCents,
      trueCostCents: t.trueCostCents,
    }));
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [data]);

  const totalOwed = lines.reduce((s, l) => s + l.owedCents, 0);
  const realCost = lines.reduce((s, l) => s + (l.trueCostCents ?? 0), 0);
  const costKnown = lines.some((l) => l.trueCostCents != null);
  const passThrough = Math.max(0, totalOwed - realCost);

  function exportCsv() {
    const header = ["Ticket ID", "Date", "Offer", "Owed (USD)"];
    const rows = lines.map((l) => [
      l.id,
      `"${formatDateTime(l.date)}"`,
      `"${l.promo}"`,
      (l.owedCents / 100).toFixed(2),
    ]);
    const total = ["", "", "Total", (totalOwed / 100).toFixed(2)];
    const csv = [header, ...rows, total].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bond-statement.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Billing" description="Your Bond statement. Read-only — no payment is collected here." />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-1" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="size-7 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={reload}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Amount owed */}
          <Card className="lg:col-span-1">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Amount owed</p>
                  <InfoTip label="What you settle with Bond for paybacks delivered to diners. It's funded by the extra spend diners made to earn those paybacks — so most of it passes through rather than coming out of your pocket." />
                </div>
                <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground tabular">
                  {formatCentsWhole(totalOwed)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">across your Bond visits</p>

                {costKnown ? (
                  <div className="mt-5 rounded-lg border border-border/70 bg-secondary/40 p-3">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      This is a <strong className="font-medium text-foreground">pass-through</strong>:
                      diners spent more to earn these paybacks, and that money routes back to them
                      through Bond. Your real cost to deliver them was about{" "}
                      <strong className="font-medium text-foreground">{formatCentsWhole(realCost)}</strong>.
                    </p>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground tabular">
                      <span>Real cost ≈ {formatCentsWhole(realCost)}</span>
                      <span>Diner-funded {formatCentsWhole(passThrough)}</span>
                    </div>
                    <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-warning/30">
                      <div
                        className="h-full bg-destructive"
                        style={{ width: `${totalOwed > 0 ? (realCost / totalOwed) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <Button onClick={exportCsv} variant="outline" className="justify-start" disabled={!lines.length}>
                  <FileSpreadsheet className="size-4" />
                  Export CSV
                </Button>
                <Button onClick={() => setPdfNote(true)} variant="outline" className="justify-start">
                  <FileText className="size-4" />
                  Download PDF
                </Button>
                {pdfNote ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="size-3.5" />
                    PDF export is stubbed in this preview.
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card className="overflow-hidden lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Statement detail</CardTitle>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Download className="size-3.5" />
                {lines.length} line items
              </span>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Offer</TableHead>
                    <TableHead className="text-right">Owed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        No Bond visits yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(l.date)}
                        </TableCell>
                        <TableCell className="font-medium text-foreground tabular">
                          {l.id.length > 14 ? l.id.slice(0, 8) : l.id}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate text-muted-foreground">{l.promo}</TableCell>
                        <TableCell className="text-right tabular font-medium text-foreground">
                          {formatCents(l.owedCents)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
                <TableFooter>
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="font-medium text-foreground">
                      Total owed
                    </TableCell>
                    <TableCell className="text-right text-base tabular font-semibold text-foreground">
                      {formatCents(totalOwed)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
