import DashboardView from "@/components/dashboard-view";
import { prisma } from "@/lib/db";
import RolesPageClient from "./roles-client";

async function getAllRoles() {
  return prisma.role.findMany({
    include: {
      permissions: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}

async function getAllPermissions() {
  return prisma.permission.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export default async function AdminRolesPage() {
  const [roles, permissions] = await Promise.all([
    getAllRoles(),
    getAllPermissions(),
  ]);

  // Transform to match expected interface (users instead of members)
  const transformedRoles = roles.map((role) => ({
    ...role,
    _count: {
      users: role._count.members,
    },
  }));

  return (
    <DashboardView title="Role Management" subtitle="Manage roles and permissions">
      <RolesPageClient
        initialRoles={transformedRoles}
        allPermissions={permissions}
      />
    </DashboardView>
  );
}
