import { ManagerSidebar } from "@/components/shared/manager-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { RoleGuard } from "@/components/shared/role-guard";

export default function BranchManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Branch Manager"]}>
      <div className="flex min-h-screen">
        <ManagerSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4">
            <div className="md:hidden w-10" />
            <Breadcrumbs />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
