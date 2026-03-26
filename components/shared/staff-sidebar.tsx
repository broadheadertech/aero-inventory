"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ShoppingBag, ClipboardList, ScanSearch, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { title: string; href: string; icon: LucideIcon };

const navItems: NavItem[] = [
  { title: "Sales Entry", href: "/staff/sales-entry", icon: ShoppingBag },
  { title: "Product Lookup", href: "/staff/lookup", icon: ScanSearch },
  { title: "Stock Overview", href: "/staff/stock-overview", icon: Package },
  { title: "Sales History", href: "/staff/history", icon: ClipboardList },
];

export function StaffSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-screen w-52 shrink-0 flex-col border-r border-border bg-card sticky top-0">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-sm font-bold tracking-tight">Aero Inventory</span>
        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">Staff</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
