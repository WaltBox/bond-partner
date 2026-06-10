"use client";

import * as React from "react";
import { partner, periods, type Period } from "@/lib/data";

type PortalState = {
  period: Period;
  setPeriod: (p: Period) => void;
  location: string;
  setLocation: (l: string) => void;
  /** Scale factor applied to base ("This month") numbers so the period
   *  selector visibly changes the dashboard. Mock-only convenience. */
  factor: number;
};

const PERIOD_FACTOR: Record<Period, number> = {
  "This month": 1,
  "All time": 8.4,
};

const PortalContext = React.createContext<PortalState | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = React.useState<Period>(periods[0]);
  const [location, setLocation] = React.useState<string>(partner.locations[0]);

  const value = React.useMemo<PortalState>(
    () => ({ period, setPeriod, location, setLocation, factor: PERIOD_FACTOR[period] }),
    [period, location]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = React.useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within <PortalProvider>");
  return ctx;
}
