import { AppSidebar } from "@/components/shared/app-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { RoleGuard } from "@/components/shared/role-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["Admin"]}>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background px-4">
            <Breadcrumbs />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
