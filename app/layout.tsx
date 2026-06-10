import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth-context";
import { PartnerProvider } from "@/components/partner-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bond · Partner Portal",
  description: "See the value Bond drives your business.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
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
