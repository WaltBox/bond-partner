"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Won't people just get cashback on meals they'd buy anyway?",
    a: (
      <>
        No — the reward is gated. Three things work together:
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            The ticket is created <strong>up front as a group plan</strong>, before anyone eats — Bond
            rewards bringing people in, not a walk-in grabbing a discount after the fact.
          </li>
          <li>
            Cashback only fires when the receipt <strong>clears the promo's threshold</strong> (e.g. 9
            tacos for 2 paybacks), so the group has to actually buy the qualifying items.
          </li>
          <li>
            Most of the payback is the diners' <strong>own extra spend cycling back</strong> (a
            pass-through). Your real cost is just the food you comped.
          </li>
        </ul>
        Net: you're filling tables with incremental group spend — not discounting your regulars.
      </>
    ),
  },
  {
    q: "How does the cashback actually get triggered?",
    a: (
      <>
        Nothing pays out until the receipt is scanned and checked against the ticket. If it clears the
        promo's threshold, the cashback on the qualifying items is split to the diners on that ticket.
        If it doesn't, no payback fires and you owe nothing.
      </>
    ),
  },
  {
    q: "What stops the same receipt being claimed twice?",
    a: (
      <>
        Every scanned receipt gets a unique <strong>fingerprint</strong> — a one-way signature built
        from three things: the <strong>merchant</strong>, the <strong>purchase time</strong> (down to
        the minute), and the <strong>exact total</strong>. If the same receipt is submitted again — by
        accident, or by two people trying to claim the same bill — the fingerprints match and the
        ticket is <strong>flagged for review</strong>.
        <p className="mt-2">
          It&apos;s never an auto-reject (a rare coincidence is technically possible), but two truly
          separate visits almost always differ in total or time, so real visits don&apos;t collide.
          Re-scanning the <em>same</em> ticket is fine — only a <em>different</em> ticket presenting the
          same receipt counts as a duplicate. And it sticks: receipt photos are purged after 90 days,
          but the fingerprint is kept, so duplicate detection still works long after the image is gone.
        </p>
      </>
    ),
  },
  {
    q: "What if everyone in the group uploads their own receipt?",
    a: (
      <>
        All good. When each person uploads their own separate check, the totals differ → different
        fingerprints → every one goes through. But if two people upload the <strong>same</strong>{" "}
        receipt, it&apos;s an instant collision → flagged. That&apos;s the built-in within-group
        safeguard.
      </>
    ),
  },
  {
    q: "What does it actually cost me?",
    a: (
      <>
        You settle the payback with Bond, but it&apos;s funded by the extra spend diners made to
        qualify — a <strong>pass-through</strong>. Your real out-of-pocket is the cost-to-make of the
        comped items, shown as <strong>True Cost</strong> on your dashboard. Set your cost-to-make in
        Settings so those numbers are accurate.
      </>
    ),
  },
  {
    q: "Do I see who the diners are?",
    a: (
      <>
        No. Bond is <strong>counts only</strong> — you see party size and totals, never names, emails,
        or any personal info.
      </>
    ),
  },
  {
    q: "What if a ticket looks wrong?",
    a: (
      <>
        Open it in <strong>Tickets</strong> and hit “Dispute this ticket.” Bond reviews the scanned
        receipt and follows up — owed amounts pause while it&apos;s looked into.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="FAQ" description="How Bond's ticketing works — and why it works for you." />

      <Card>
        <CardContent className="py-1">
          <div className="divide-y divide-border/70">
            {FAQS.map((f, i) => (
              <FaqItem key={i} q={f.q}>
                {f.a}
              </FaqItem>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-[15px] font-semibold text-foreground">{q}</span>
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform",
            open && "rotate-180 border-primary/30 text-primary"
          )}
        >
          <ChevronDown className="size-4" />
        </span>
      </button>
      {open ? (
        <div className="pb-4 pr-9 text-sm leading-relaxed text-muted-foreground">{children}</div>
      ) : null}
    </div>
  );
}
