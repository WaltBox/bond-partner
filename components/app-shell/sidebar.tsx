"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, FileText, Settings, HelpCircle, Images, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { BondLogo } from "./logo";
import { ConfirmSignOut } from "./sign-out-button";
import { usePartner } from "@/components/partner-context";
import { useAuth } from "@/components/auth-context";
import { PartnerAvatar } from "@/components/partner-avatar";

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Receipt },
  { label: "Moments", href: "/moments", icon: Images },
  { label: "Billing", href: "/billing", icon: FileText },
  { label: "FAQ", href: "/faq", icon: HelpCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const { partner } = usePartner();
  const { user } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex lg:sticky lg:top-0 lg:h-screen">
      <div className="flex h-16 items-center px-5">
        <Link href="/dashboard" aria-label="Dashboard">
          <BondLogo />
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-secondary font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-[18px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Account */}
      <div className="space-y-2 border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1">
          <PartnerAvatar name={partner?.name} logoUrl={partner?.logoUrl} className="size-9 rounded-lg text-sm" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium text-foreground">{partner?.name ?? "—"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {(user?.username as string) || user?.email || partner?.category || "Partner"}
            </p>
          </div>
        </div>
        <ConfirmSignOut>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          >
            <LogOut className="size-[18px]" />
            Log out
          </button>
        </ConfirmSignOut>
      </div>
    </aside>
  );
}
