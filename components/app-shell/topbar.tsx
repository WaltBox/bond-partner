"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LayoutDashboard, Receipt, FileText, Settings, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePartner } from "@/components/partner-context";
import { useAuth } from "@/components/auth-context";
import { PartnerAvatar } from "@/components/partner-avatar";
import { BondLogo } from "./logo";
import { cn } from "@/lib/utils";

const mobileNav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tickets", href: "/tickets", icon: Receipt },
  { label: "Billing", href: "/billing", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { partner, loading } = usePartner();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
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
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <SheetClose asChild key={href}>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="size-[18px]" />
                    {label}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Account chip */}
      <div className="ml-auto flex items-center gap-3">
        <div className="text-right leading-tight">
          {loading ? (
            <>
              <Skeleton className="ml-auto h-4 w-24" />
              <Skeleton className="ml-auto mt-1 h-3 w-16" />
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">{partner?.name ?? "—"}</p>
              <p className="text-xs capitalize text-muted-foreground">{partner?.category ?? "Partner"}</p>
            </>
          )}
        </div>
        <PartnerAvatar
          name={partner?.name}
          logoUrl={partner?.logoUrl}
          className="size-9 rounded-lg text-sm"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => signOut().then(() => router.replace("/login"))}
        >
          <LogOut className="size-[18px]" />
        </Button>
      </div>
    </header>
  );
}
