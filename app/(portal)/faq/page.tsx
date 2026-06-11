"use client";

import * as React from "react";
import {
  Users,
  Utensils,
  ScanLine,
  BadgeCheck,
  HandCoins,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Users,
    title: "Your crew makes a plan",
    body: "A diner opens Bond and invites people to eat at your spot. That creates a ticket — the redemption — with the party on it (counts only, never names). Say 2 diners are on it.",
  },
  {
    icon: Utensils,
    title: "They eat & pay full price",
    body: "The table orders and pays like any other guest — full price, straight into your register. Nothing is discounted at the counter.",
  },
  {
    icon: ScanLine,
    title: "They scan the receipt",
    body: "The receipt is scanned against that ticket and AI-parsed into line items — so Bond can see exactly what was bought.",
  },
  {
    icon: BadgeCheck,
    title: "Bond checks the promo",
    body: "The receipt has to hit the promo's threshold. A 2-person ticket on “Buy 3 Tacos, Get 1 Paid Back” needs 9 tacos on it for 2 to qualify. Miss the threshold and nothing fires.",
  },
  {
    icon: HandCoins,
    title: "Cashback goes back",
    body: "If it qualifies, the cashback on those 2 tacos is paid to the diners on the ticket. If it doesn't, there's no payback — and you owe nothing.",
  },
];

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What's actually a “ticket”?",
    a: (
      <>
        A ticket is the redemption created in the Bond app <strong>before the meal</strong> — when a
        diner invites their crew to eat at your spot. It locks in who's on the visit (a count, no
        names) and which promo applies, so the reward is tied to a real, planned group outing.
      </>
    ),
  },
  {
    q: "What stops people just getting cashback on a meal they'd buy anyway?",
    a: (
      <>
        Three things work together:
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            The ticket is created <strong>up front as a group plan</strong> — Bond rewards bringing
            people in, not a walk-in grabbing a discount after the fact.
          </li>
          <li>
            Cashback only fires when the receipt <strong>hits the promo's threshold</strong> (e.g. 9
            tacos for 2 paybacks), so they have to actually buy the qualifying items — more than a
            casual visit.
          </li>
          <li>
            Most of the payback is the diners' <strong>own extra spend cycling back</strong> (a
            pass-through). Your real cost is just the food you comped.
          </li>
        </ul>
        Net: you're filling tables with incremental group spend — not handing your regulars a random
        discount.
      </>
    ),
  },
  {
    q: "How does the cashback actually get triggered?",
    a: (
      <>
        Nothing pays out until the receipt is scanned and checked against the ticket. The promo sets
        the threshold; if the receipt meets it, the cashback on the qualifying items is distributed to
        the diners on that ticket. If it doesn't, no payback fires and you owe nothing.
      </>
    ),
  },
  {
    q: "What does it actually cost me?",
    a: (
      <>
        You settle the payback with Bond, but it's funded by the extra spend diners made to qualify —
        a <strong>pass-through</strong>. Your real out-of-pocket is the cost-to-make of the comped
        items, which shows up as <strong>True Cost</strong> on your dashboard. Set your cost-to-make
        in Settings so those numbers are accurate.
      </>
    ),
  },
  {
    q: "Do I see who the diners are?",
    a: (
      <>
        No. Bond is <strong>counts only</strong> — you see party size and totals, never names, emails,
        or any personal info. Diner privacy is never shared with partners.
      </>
    ),
  },
  {
    q: "What if a ticket looks wrong?",
    a: (
      <>
        Open it in <strong>Tickets</strong> and hit “Dispute this ticket.” Bond reviews the scanned
        receipt and follows up — owed amounts pause while it's looked into.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader title="FAQ" description="How Bond's ticketing works — and why it works for you." />

      {/* How a ticket works */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>How a Bond ticket works</CardTitle>
          <p className="text-sm text-muted-foreground">From plan to payback, step by step.</p>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-5 before:absolute before:left-[18px] before:top-2 before:h-[calc(100%-2.5rem)] before:w-px before:bg-border">
            {STEPS.map((s, i) => (
              <li key={i} className="relative flex gap-4">
                <span className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm">
                  <s.icon className="size-[18px]" />
                </span>
                <div className="pt-1">
                  <p className="font-display text-[15px] font-bold text-foreground">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Q&A */}
      <Card>
        <CardHeader>
          <CardTitle>Common questions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
        <span className="font-display text-[15px] font-bold text-foreground">{q}</span>
        <ChevronDown
          className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="pb-4 pr-8 text-sm leading-relaxed text-muted-foreground">{children}</div>
      ) : null}
    </div>
  );
}
