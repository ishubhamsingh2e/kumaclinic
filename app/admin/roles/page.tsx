import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { RoleMatrix } from "./role-matrix";

async function getData() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
    },
    orderBy: {
        name: 'asc'
    }
  });

  const permissions = await prisma.permission.findMany({
    orderBy: {
        name: 'asc'
    }
  });

  return { roles, permissions };
}

export default async function RolesPage() {
  // Check for either ROLE_MANAGE or CLINIC_OWNER_MANAGE (temporary fallback)
  const canManageRoles = await hasPermission(PERMISSIONS.ROLE_MANAGE);
  const canManageOwners = await hasPermission(PERMISSIONS.CLINIC_OWNER_MANAGE);

  if (!canManageRoles && !canManageOwners) {
    return redirect("/dashboard?error=unauthorized");
  }

  const { roles, permissions } = await getData();

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Role & Permission Matrix</h1>
        <p className="text-muted-foreground text-sm">
          Map permissions to roles. Changes apply immediately.
        </p>
      </div>
      <RoleMatrix roles={roles} allPermissions={permissions} />
    </div>
  );
}
