"use client";

import { useState } from "react";
import {
  BarChart3,
  Layers,
  ArrowLeftRight,
  TrendingUp,
  RefreshCw,
  FileText,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { title: string; href: string; icon: LucideIcon };

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/manager/dashboard", icon: BarChart3 },
  { title: "Stock Overview", href: "/manager/stock-overview", icon: Layers },
  { title: "Transfers", href: "/manager/transfers", icon: ArrowLeftRight },
  { title: "Trends", href: "/manager/trends", icon: TrendingUp },
  { title: "Replenishment", href: "/replenishment", icon: RefreshCw },
  { title: "Reports", href: "/manager/reports", icon: FileText },
];

export function ManagerSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div>
          <span className="text-sm font-bold tracking-tight">Aero Inventory</span>
          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Manager</span>
        </div>
        <button className="md:hidden rounded-md p-1 hover:bg-muted" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" onClick={() => setMobileOpen(false)}>
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
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed left-4 top-4 z-50 rounded-md border bg-background p-2 shadow-sm md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 md:hidden",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-56 shrink-0 flex-col border-r border-border bg-card sticky top-0">
        {navContent}
      </aside>
    </>
  );
}
