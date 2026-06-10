import Link from "next/link";
import { CalendarClock, TrendingUp, ReceiptText, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BondMark } from "@/components/app-shell/logo";

// Swap to your scheduling link (e.g. a Calendly URL) when ready.
const DEMO_URL = "mailto:partnerships@usebond.com?subject=Bond%20Partner%20Demo";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <BondMark className="size-8" />
            <span className="text-[17px] font-semibold tracking-tight text-foreground">Bond</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <a href={DEMO_URL}>Schedule a demo</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-gradient-to-b from-primary/[0.06] to-transparent" />
          <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                Bond for Partners
              </span>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
                Turn slow shifts into full tables.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Bond brings diners through your door with cash-back rewards. This portal shows you
                the sales it drives, what you actually keep, and what it really costs — down to the
                receipt.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <a href={DEMO_URL}>
                    <CalendarClock className="size-4" />
                    Schedule a demo
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">
                    Log in
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Metrics preview */}
            <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              <PreviewStat icon={TrendingUp} tone="primary" label="Sales Driven" value="$12,450" />
              <PreviewStat icon={ReceiptText} tone="rose" label="Real Cost" value="$480" />
              <PreviewStat icon={Wallet} tone="emerald" label="Made from Bond" value="$9,660" />
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ValueCard
              title="Fill your slow shifts"
              body="Paybacks pull diners in on the nights your tables would otherwise sit empty."
            />
            <ValueCard
              title="Only pay on real sales"
              body="What you owe Bond is a slice of spend Bond created — never a flat ad fee with no return."
            />
            <ValueCard
              title="See your true cost"
              body="Set your cost-to-make and watch exactly what each payback costs you versus what it drives."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <BondMark className="size-6" />
            <span className="font-medium text-foreground">Bond</span>
            <span className="text-muted-foreground">· Partner Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <a href={DEMO_URL} className="hover:text-foreground">
              Schedule a demo
            </a>
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const TONE: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  rose: "bg-destructive/10 text-destructive",
  emerald: "bg-success/10 text-success",
};

function PreviewStat({
  icon: Icon,
  tone,
  label,
  value,
}: {
  icon: typeof TrendingUp;
  tone: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm shadow-black/[0.02]">
      <div className={`flex size-8 items-center justify-center rounded-lg ${TONE[tone]}`}>
        <Icon className="size-4" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tracking-tight text-foreground tabular">{value}</p>
    </div>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm shadow-black/[0.02]">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
