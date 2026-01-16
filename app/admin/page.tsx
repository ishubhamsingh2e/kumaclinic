import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminClient } from "./admin-client";
import { ClientDashboardView } from "@/components/client-dashboard-view";

async function getUsers() {
  const users = await prisma.user.findMany({
    include: {
      memberships: {
        include: {
          role: true,
          clinic: true,
        },
      },
    },
  });
  return users;
}

async function getClinics() {
  return prisma.clinic.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export default async function AdminPage() {
  const canManage = await hasPermission(PERMISSIONS.CLINIC_OWNER_MANAGE);
  if (!canManage) {
    return redirect("/dashboard?error=unauthorized");
  }

  const [users, clinics] = await Promise.all([getUsers(), getClinics()]);

  return (
    <ClientDashboardView title="Platform Administration">
      <AdminClient users={users} clinics={clinics} />
    </ClientDashboardView>
  );
}
