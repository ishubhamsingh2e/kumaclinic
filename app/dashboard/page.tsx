import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";

export default async function DashboardPage() {
  const canViewDashboard = await hasPermission(PERMISSIONS.DASHBOARD_READ);

  if (!canViewDashboard) {
    return (
      <div>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}
