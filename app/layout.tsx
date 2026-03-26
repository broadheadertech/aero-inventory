import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/convex-client-provider";
import { SyncUser } from "@/components/shared/sync-user";
import { RoleSwitcher } from "@/components/shared/role-switcher";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Aero Inventory Monitoring System",
  description: "Sell-thru tracking and inventory monitoring for Aeropostale Philippines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.className} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
        >
          <ConvexClientProvider>
            <TooltipProvider>
              {children}
            </TooltipProvider>
            <SyncUser />
            <RoleSwitcher />
          </ConvexClientProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
