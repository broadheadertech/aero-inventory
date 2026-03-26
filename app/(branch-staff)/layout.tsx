import { BottomTabBar } from "@/components/shared/bottom-tab-bar";
import { StaffSidebar } from "@/components/shared/staff-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { RoleGuard } from "@/components/shared/role-guard";

export default function BranchStaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Branch Staff"]}>
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <StaffSidebar />

        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4">
            {/* Mobile: show brand */}
            <div className="md:hidden">
              <span className="text-sm font-bold tracking-tight">Aero Inventory</span>
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">Staff</span>
            </div>
            {/* Desktop: show breadcrumbs */}
            <div className="hidden md:block">
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          {/* Content - mobile has bottom padding for tab bar */}
          <main className="flex-1 pb-20 md:pb-6 md:p-6">{children}</main>
        </div>

        {/* Mobile bottom tabs */}
        <div className="md:hidden">
          <BottomTabBar />
        </div>
      </div>
    </RoleGuard>
  );
}
