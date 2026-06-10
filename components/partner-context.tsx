"use client";

import * as React from "react";
import {
  getMe,
  getOnboarding,
  getPartner,
  setActivePartnerId,
  type Membership,
  type Onboarding,
  type PartnerInfo,
} from "@/lib/api";
import { useAuth } from "@/components/auth-context";

type PartnerState = {
  partners: Membership[];
  partner: PartnerInfo | null;
  onboarding: Onboarding | null;
  loading: boolean;
  error: string | null;
  selectPartner: (id: string) => void;
  refresh: () => void;
};

const PartnerContext = React.createContext<PartnerState | null>(null);

/**
 * Resolves the logged-in user's company via GET /api/partner/me, sets it as the
 * active partner for all subsequent calls, and loads its profile + onboarding.
 */
export function PartnerProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [partners, setPartners] = React.useState<Membership[]>([]);
  const [partner, setPartner] = React.useState<PartnerInfo | null>(null);
  const [onboarding, setOnboarding] = React.useState<Onboarding | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    if (!user) {
      setActivePartnerId(null);
      setPartners([]);
      setPartner(null);
      setOnboarding(null);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    (async () => {
      const me = await getMe();
      if (!alive) return;
      setPartners(me.partners);
      const chosen = me.partners.find((p) => p.id === selectedId) ?? me.partners[0] ?? null;
      if (!chosen) {
        setActivePartnerId(null);
        setPartner(null);
        setOnboarding(null);
        setLoading(false);
        return;
      }
      setActivePartnerId(chosen.id);
      const [profile, ob] = await Promise.all([
        getPartner().catch(() => null),
        getOnboarding().catch(() => null),
      ]);
      if (!alive) return;
      setPartner(
        profile ?? {
          id: chosen.id,
          name: chosen.name,
          category: chosen.category ?? null,
          logoUrl: chosen.logoUrl ?? null,
        }
      );
      setOnboarding(ob);
      setLoading(false);
    })().catch((e) => {
      if (alive) {
        setError(e?.message ?? "Failed to load your company");
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [user, selectedId, nonce]);

  const value = React.useMemo<PartnerState>(
    () => ({
      partners,
      partner,
      onboarding,
      loading,
      error,
      selectPartner: setSelectedId,
      refresh: () => setNonce((n) => n + 1),
    }),
    [partners, partner, onboarding, loading, error]
  );

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
}

export function usePartner() {
  const ctx = React.useContext(PartnerContext);
  if (!ctx) throw new Error("usePartner must be used within <PartnerProvider>");
  return ctx;
}
