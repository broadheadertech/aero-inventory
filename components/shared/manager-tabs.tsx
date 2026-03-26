"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";

const managerTabs = [
  { label: "Dashboard", href: "/manager/dashboard" },
  { label: "Stock Overview", href: "/manager/stock-overview" },
  { label: "Sales History", href: "/manager/sales-history" },
  { label: "Transfers", href: "/manager/transfers" },
  { label: "Trends", href: "/manager/trends" },
  { label: "Replenishment", href: "/manager/replenishment" },
  { label: "Reports", href: "/manager/reports" },
];

export function ManagerTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-40 flex items-center border-b bg-background"
      aria-label="Branch Manager navigation"
    >
      <div className="flex flex-1 overflow-x-auto px-4 scrollbar-none">
        {managerTabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex-none whitespace-nowrap px-4 py-3 text-sm font-medium",
                "border-b-2 transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="flex-none pr-2">
        <NotificationBell />
      </div>
    </nav>
  );
}
