"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  "sell-thru": "Sell-Thru",
  "stock-overview": "Stock Overview",
  branches: "Branches",
  products: "Products",
  users: "Users",
  warehouse: "Warehouse",
  transfers: "Transfers",
  allocation: "Allocation",
  history: "History",
  "trading-calendar": "Trading Calendar",
  trends: "Trends",
  forecasts: "Forecasts",
  "ml-forecasts": "ML Forecasts",
  training: "Training",
  accuracy: "Accuracy",
  benchmarks: "Benchmarks",
  pnl: "P&L",
  suppliers: "Suppliers",
  "purchase-orders": "Purchase Orders",
  "markdown-proposals": "Markdown Proposals",
  autonomous: "Autonomous",
  "pos-status": "POS Status",
  feedback: "Feedback",
  loyalty: "Loyalty",
  reports: "Reports",
  settings: "Settings",
  thresholds: "Thresholds",
  alerts: "Alert Rules",
  "aging-policies": "Aging Policies",
  replenishment: "Replenishment",
  "markdown-rules": "Markdown Rules",
  "reorder-rules": "Reorder Rules",
  weather: "Weather",
  pos: "POS Config",
  "feedback-themes": "Feedback Themes",
  regions: "Regions",
  seed: "Seed Data",
  "no-role": "No Role",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = labelMap[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map(({ href, label, isLast }) => (
        <span key={href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          {isLast ? (
            <span className="font-medium text-foreground">{label}</span>
          ) : (
            <Link href={href} className="text-muted-foreground hover:text-foreground">
              {label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
