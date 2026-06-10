"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Building2 } from "lucide-react";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-context";
import { usePartner } from "@/components/partner-context";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, loading: authLoading, signOut } = useAuth();
  const { partners, onboarding, loading: pLoading, error } = usePartner();

  const needsOnboarding =
    !!onboarding && onboarding.status !== "complete" && onboarding.status !== "live";

  React.useEffect(() => {
    if (!authLoading && !session) router.replace("/login");
  }, [authLoading, session, router]);

  React.useEffect(() => {
    if (session && !pLoading && needsOnboarding) router.replace("/onboarding");
  }, [session, pLoading, needsOnboarding, router]);

  // Loading / redirecting states
  if (authLoading || !session || (pLoading && partners.length === 0)) return <FullSpinner />;
  if (error) return <FullMessage icon={AlertCircle} title="Couldn't load your account" body={error} />;
  if (!pLoading && partners.length === 0)
    return (
      <FullMessage
        icon={Building2}
        title="No business linked yet"
        body="Your account isn't connected to a partner business. Use your Bond invite link to get set up."
        action={
          <Button variant="outline" onClick={() => signOut().then(() => router.replace("/login"))}>
            Sign out
          </Button>
        }
      />
    );
  if (needsOnboarding) return <FullSpinner />;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function FullSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function FullMessage({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: typeof AlertCircle;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
        {action}
      </div>
    </div>
  );
}
