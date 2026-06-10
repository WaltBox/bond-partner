"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, FileText, Settings, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import { BondLogo } from "./logo";

const nav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Receipt },
  { label: "Billing", href: "/billing", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card/60 lg:flex">
      <div className="flex h-16 items-center px-6">
        <Link href="/" aria-label="Bond home">
          <BondLogo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("size-[18px]", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <LifeBuoy className="size-[18px]" />
          Support
        </a>
        <div className="mt-3 rounded-xl border border-border/70 bg-secondary/50 p-3">
          <p className="text-xs font-medium text-foreground">Bond for Partners</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Paybacks that fill your slow shifts.
          </p>
        </div>
      </div>
    </aside>
  );
}
