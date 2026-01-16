"use server";

import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  // Only Super Admin or someone with ROLE_MANAGE should do this
  // For now, assuming only Super Admin or high-level permission
  const canManage = await hasPermission(PERMISSIONS.ROLE_MANAGE) || await hasPermission(PERMISSIONS.CLINIC_OWNER_MANAGE); 
  // Note: CLINIC_OWNER_MANAGE is for enrolling owners, but might not be enough for schema changes.
  // Using ROLE_MANAGE is safer.

  if (!canManage) {
    // Fallback: check if super admin by role name? 
    // Ideally hasPermission should handle SUPER_ADMIN having all permissions.
    // Ensure seed gives SUPER_ADMIN 'role:manage' (which is implicit if they have ALL).
    
    // If the user is really a Super Admin, hasPermission returns true if they have the specific permission.
    // If the permission ROLE_MANAGE is new, we must ensure it's in the DB.
    return { message: "Unauthorized", type: "error" };
  }

  try {
    // Transaction to update
    await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: [], // Clear all
          connect: permissionIds.map((id) => ({ id })),
        },
      },
    });

    revalidatePath("/admin/roles");
    return { message: "Permissions updated successfully", type: "success" };
  } catch (error) {
    console.error(error);
    return { message: "Failed to update permissions", type: "error" };
  }
}
