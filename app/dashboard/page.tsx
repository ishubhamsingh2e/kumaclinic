import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardView from "@/components/dashboard-view";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has any clinic memberships
  const membershipCount = await prisma.clinicMember.count({
    where: {
      userId: session.user.id,
    },
  });

  const hasClinicMembership = membershipCount > 0;

  // Show empty state for new users without clinic membership
  if (!hasClinicMembership) {
    return (
      <DashboardView title="Dashboard">
        <DashboardEmptyState />
      </DashboardView>
    );
  }

  const canViewDashboard = await hasPermission(PERMISSIONS.DASHBOARD_READ);

  if (!canViewDashboard) {
    return (
      <DashboardView title="Dashboard">
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </div>
      </DashboardView>
    );
  }

  return (
    <DashboardView title="Dashboard">
      <div>
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your dashboard!</p>
      </div>
    </DashboardView>
  );
}
