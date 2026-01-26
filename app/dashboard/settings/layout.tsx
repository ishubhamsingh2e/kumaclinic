import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardView from "@/components/dashboard-view";
import { SettingsNav } from "@/components/settings/settings-nav";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const activeClinicId = session.user.activeClinicId;
  const isManager =
    session.user.role === "CLINIC_MANAGER" || session.user.role === "ADMIN";
  const canManageUsers = await hasPermission(PERMISSIONS.USER_MANAGE);
  
  // Fetch user to check if they are a doctor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { title: true },
  });
  const isDoctor = user?.title === "Dr.";

  return (
    <DashboardView title="Settings">
      <div className="space-y-6">
        <SettingsNav
          hasClinic={!!activeClinicId}
          isManager={isManager}
          canManageUsers={canManageUsers}
          isDoctor={isDoctor}
        />
        {children}
      </div>
    </DashboardView>
  );
}
