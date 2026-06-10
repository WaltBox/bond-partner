"use client";

import * as React from "react";
import { Download, FileText, FileSpreadsheet, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { statement, dashboard } from "@/lib/data";
import { formatCents, formatCentsWhole } from "@/lib/format";

const PERIODS = ["June 2026", "May 2026", "April 2026"];

export default function BillingPage() {
  const [period, setPeriod] = React.useState(statement.period);
  const [pdfNote, setPdfNote] = React.useState(false);

  function exportCsv() {
    const header = ["Ticket ID", "Date", "Promo", "Owed (USD)"];
    const rows = statement.lines.map((l) => [
      l.id,
      `"${l.date}"`,
      `"${l.promo}"`,
      (l.owedCents / 100).toFixed(2),
    ]);
    const total = ["", "", "Total", (statement.totalOwedCents / 100).toFixed(2)];
    const csv = [header, ...rows, total].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bond-statement-${period.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Billing" description="Your Bond statement. Read-only — no payment is collected here.">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]" aria-label="Statement period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Amount owed */}
        <Card className="lg:col-span-1">
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-muted-foreground">Amount owed this period</p>
                <InfoTip label="What you settle with Bond for paybacks delivered to diners. It's funded by the extra spend diners made to earn those paybacks — so most of it passes through rather than coming out of your pocket." />
              </div>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground tabular">
                {formatCentsWhole(statement.totalOwedCents)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{period}</p>

              <div className="mt-5 rounded-lg border border-border/70 bg-secondary/40 p-3">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This is a{" "}
                  <strong className="font-medium text-foreground">pass-through</strong>: diners spent
                  more to earn these paybacks, and that money routes back to them through Bond. Your
                  real cost to deliver them was about{" "}
                  <strong className="font-medium text-foreground">
                    {formatCentsWhole(dashboard.metrics.trueCostCents)}
                  </strong>{" "}
                  in food.
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground tabular">
                  <span>Real cost ≈ {formatCentsWhole(dashboard.metrics.trueCostCents)}</span>
                  <span>
                    Diner-funded{" "}
                    {formatCentsWhole(statement.totalOwedCents - dashboard.metrics.trueCostCents)}
                  </span>
                </div>
                <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-warning/30">
                  <div
                    className="h-full bg-destructive"
                    style={{
                      width: `${(dashboard.metrics.trueCostCents / statement.totalOwedCents) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={exportCsv} variant="outline" className="justify-start">
                <FileSpreadsheet className="size-4" />
                Export CSV
              </Button>
              <Button
                onClick={() => setPdfNote(true)}
                variant="outline"
                className="justify-start"
              >
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
              {statement.lines.length} line items
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Promo</TableHead>
                  <TableHead className="text-right">Owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{l.date}</TableCell>
                    <TableCell className="font-medium text-foreground tabular">{l.id}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">{l.promo}</TableCell>
                    <TableCell className="text-right tabular font-medium text-foreground">
                      {formatCents(l.owedCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="font-medium text-foreground">
                    Total owed
                  </TableCell>
                  <TableCell className="text-right text-base tabular font-semibold text-foreground">
                    {formatCents(statement.totalOwedCents)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
