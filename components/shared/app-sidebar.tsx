"use client";

import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  FileText,
  Settings,
  Truck,
  TrendingUp,
  Bot,
  Heart,
  Warehouse,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { title: string; href: string };
type NavGroup = { label: string; icon: LucideIcon; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    icon: BarChart3,
    items: [
      { title: "Dashboard", href: "/dashboard" },
      { title: "Sell-Thru", href: "/sell-thru" },
      { title: "Stock Overview", href: "/stock-overview" },
      { title: "Branches", href: "/branches" },
      { title: "Products", href: "/products" },
      { title: "Users", href: "/users" },
    ],
  },
  {
    label: "Operations",
    icon: Warehouse,
    items: [
      { title: "Warehouse", href: "/warehouse" },
      { title: "Transfers", href: "/transfers" },
      { title: "Allocation", href: "/allocation" },
      { title: "Trading Calendar", href: "/trading-calendar" },
    ],
  },
  {
    label: "Analytics",
    icon: TrendingUp,
    items: [
      { title: "Trends", href: "/trends" },
      { title: "Forecasts", href: "/forecasts" },
      { title: "ML Forecasts", href: "/ml-forecasts" },
      { title: "ML Training", href: "/ml-forecasts/training" },
      { title: "Benchmarks", href: "/benchmarks" },
      { title: "P&L", href: "/pnl" },
    ],
  },
  {
    label: "Supply Chain",
    icon: Truck,
    items: [
      { title: "Suppliers", href: "/suppliers" },
      { title: "Purchase Orders", href: "/purchase-orders" },
      { title: "Markdown Proposals", href: "/markdown-proposals" },
    ],
  },
  {
    label: "Automation",
    icon: Bot,
    items: [
      { title: "Autonomous Engine", href: "/autonomous" },
      { title: "Guardrails", href: "/autonomous/settings" },
      { title: "POS Status", href: "/pos-status" },
    ],
  },
  {
    label: "Customers",
    icon: Heart,
    items: [
      { title: "Loyalty", href: "/loyalty" },
      { title: "Feedback", href: "/feedback" },
    ],
  },
  {
    label: "Reports",
    icon: FileText,
    items: [
      { title: "Reports", href: "/reports" },
    ],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [
      { title: "Thresholds", href: "/settings/thresholds" },
      { title: "Alert Rules", href: "/settings/alerts" },
      { title: "Aging Policies", href: "/settings/aging-policies" },
      { title: "Replenishment", href: "/settings/replenishment" },
      { title: "Markdown Rules", href: "/settings/markdown-rules" },
      { title: "Reorder Rules", href: "/settings/reorder-rules" },
      { title: "Weather", href: "/settings/weather" },
      { title: "POS Config", href: "/settings/pos" },
      { title: "Feedback Themes", href: "/settings/feedback-themes" },
      { title: "Loyalty API", href: "/settings/loyalty" },
      { title: "Regions", href: "/settings/regions" },
    ],
  },
];

function NavGroupItem({ group, pathname }: { group: NavGroup; pathname: string }) {
  const isActive = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const [open, setOpen] = useState(isActive);
  const Icon = group.icon;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive && "text-foreground",
          !isActive && "text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
          {group.items.map((item) => {
            const itemActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  itemActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  const handleNavClick = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <span className="text-base font-bold tracking-tight">Aero Inventory</span>
        <button className="md:hidden rounded-md p-1 hover:bg-muted" onClick={() => setMobileOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" onClick={handleNavClick}>
        {navGroups.map((group) => (
          <NavGroupItem key={group.label} group={group} pathname={pathname} />
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
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
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
