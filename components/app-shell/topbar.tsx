"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut, LayoutDashboard, Receipt, FileText, Settings, HelpCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePartner } from "@/components/partner-context";
import { PartnerAvatar } from "@/components/partner-avatar";
import { BondLogo } from "./logo";
import { ConfirmSignOut } from "./sign-out-button";
import { cn } from "@/lib/utils";

const mobileNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Receipt },
  { label: "Billing", href: "/billing", icon: FileText },
  { label: "FAQ", href: "/faq", icon: HelpCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

/** Mobile-only header. On desktop the sidebar carries the nav + account. */
export function Topbar() {
  const pathname = usePathname();
  const { partner } = usePartner();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="h-16 justify-center border-b px-6">
            <SheetTitle className="text-left">
              <BondLogo />
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-1 p-3">
            {mobileNav.map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <SheetClose asChild key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                      active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className={cn("size-[18px]", active && "text-primary")} />
                    {label}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <Link href="/dashboard" aria-label="Dashboard">
        <BondLogo />
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <PartnerAvatar name={partner?.name} logoUrl={partner?.logoUrl} className="size-8 rounded-lg text-xs" />
        <ConfirmSignOut>
          <Button variant="ghost" size="icon" aria-label="Sign out">
            <LogOut className="size-[18px]" />
          </Button>
        </ConfirmSignOut>
      </div>
    </header>
  );
}
