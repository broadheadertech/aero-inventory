"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ShoppingBag, ClipboardList, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const staffTabs = [
  { label: "Sales", href: "/staff/sales-entry", icon: ShoppingBag },
  { label: "Lookup", href: "/staff/lookup", icon: ScanSearch },
  { label: "Stock", href: "/staff/stock-overview", icon: Package },
  { label: "History", href: "/staff/history", icon: ClipboardList },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-background/95 backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Branch Staff navigation"
    >
      {staffTabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2",
              "min-h-[56px] select-none touch-manipulation",
              "text-[11px] font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              isActive ? "bg-primary/10" : ""
            )}>
              <tab.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} aria-hidden="true" />
            </div>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
