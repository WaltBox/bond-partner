import type { Metadata } from "next";
import { Inter, Baloo_2, Caveat } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth-context";
import { PartnerProvider } from "@/components/partner-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Bond brand fonts — used on the marketing home page (the portal stays on Inter).
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bond · Partner Portal",
  description: "See the value Bond drives your business.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${baloo.variable} ${caveat.variable}`}>
      <body>
        <AuthProvider>
          <PartnerProvider>
            <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
          </PartnerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
