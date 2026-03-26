import { UserTable } from "@/components/users/user-table";

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Create, edit, and deactivate user accounts.
        </p>
      </div>
      <UserTable />
    </div>
  );
}
