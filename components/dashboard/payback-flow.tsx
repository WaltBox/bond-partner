"use client";

import { CreditCard, RefreshCw, PiggyBank, ArrowRight, ArrowDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function Node({
  icon: Icon,
  amount,
  label,
  sub,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  amount: string;
  label: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "flex-1 rounded-xl border p-4",
        highlight ? "border-primary/30 bg-primary/[0.06]" : "border-border/70 bg-secondary/30",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span
          className={[
            "flex size-8 items-center justify-center rounded-lg",
            highlight ? "bg-primary/15 text-primary" : "bg-card text-muted-foreground",
          ].join(" ")}
        >
          <Icon className="size-4" />
        </span>
        <span className="text-xl font-semibold tracking-tight text-foreground tabular">{amount}</span>
      </div>
      <p className="mt-2.5 text-sm font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{sub}</p>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex shrink-0 items-center justify-center self-center text-muted-foreground/50">
      <ArrowRight className="hidden size-5 sm:block" />
      <ArrowDown className="size-5 sm:hidden" />
    </div>
  );
}

/** "How a payback flows" — collapsed behind a button; opens in a dialog. */
export function PaybackFlow() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="size-4" />
          How a payback flows
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>How a payback flows</DialogTitle>
          <DialogDescription>One $15 visit — the payback is the diner&apos;s own money, returned.</DialogDescription>
        </DialogHeader>

        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Node icon={CreditCard} amount="$15" label="Diner pays you" sub="Full price, at your table." />
          <Connector />
          <Node
            icon={RefreshCw}
            amount="$5"
            label="Passes back through Bond"
            sub="Part of what they spent, returned to them."
            highlight
          />
          <Connector />
          <Node icon={PiggyBank} amount="$10" label="You keep" sub="Plus a diner who's likely to return." />
        </div>

        <p className="rounded-lg border border-primary/15 bg-primary/[0.04] p-3.5 text-sm leading-relaxed text-foreground">
          The amount paid back isn&apos;t extra money out of your pocket — it&apos;s part of what the
          diner already spent, routed back to them through Bond. Your only real cost is what it cost
          you to make the item they earned.
        </p>
      </DialogContent>
    </Dialog>
  );
}
