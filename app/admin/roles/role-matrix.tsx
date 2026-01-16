"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateRolePermissions } from "@/lib/actions/role";
import { Loader2 } from "lucide-react";
import { Permission, Role } from "@/lib/generated/prisma/client";

type RoleWithPermissions = Role & { permissions: Permission[] };

export function RoleMatrix({
  roles,
  allPermissions,
}: {
  roles: RoleWithPermissions[];
  allPermissions: Permission[];
}) {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const isSuperAdmin = (roleName: string) => roleName === "SUPER_ADMIN";

  const handleToggle = async (
    role: RoleWithPermissions,
    permissionId: string,
    checked: boolean,
  ) => {
    if (isSuperAdmin(role.name)) return;

    const currentPermissionIds = role.permissions.map((p) => p.id);
    let newPermissionIds: string[];

    if (checked) {
      newPermissionIds = [...currentPermissionIds, permissionId];
    } else {
      newPermissionIds = currentPermissionIds.filter(
        (id) => id !== permissionId,
      );
    }

    setLoadingMap((prev) => ({ ...prev, [role.id]: true }));

    // Optimistic update could happen here, but for safety waiting for server
    const res = await updateRolePermissions(role.id, newPermissionIds);

    if (res.type === "success") {
      toast.success(`Updated ${role.name}`);
      // In a real app with router refresh, the prop would update.
      // Since we use revalidatePath, the page should reload/refresh data.
    } else {
      toast.error(res.message);
    }

    setLoadingMap((prev) => ({ ...prev, [role.id]: false }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
              Role
            </th>
            {allPermissions.map((perm) => (
              <th
                key={perm.id}
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                title={perm.description || perm.name}
              >
                {perm.name.replace(/:/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {roles.map((role) => (
            <tr key={role.id}>
              <td className="px-6 py-4 font-medium whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {role.name}
                  {loadingMap[role.id] && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                </div>
              </td>
              {allPermissions.map((perm) => {
                const hasPerm = role.permissions.some((p) => p.id === perm.id);
                return (
                  <td
                    key={perm.id}
                    className="px-6 py-4 text-center whitespace-nowrap"
                  >
                    <Checkbox
                      checked={hasPerm}
                      onCheckedChange={(checked) =>
                        handleToggle(role, perm.id, checked as boolean)
                      }
                      disabled={isSuperAdmin(role.name) || loadingMap[role.id]}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-gray-500">
        * SUPER_ADMIN always has all permissions and cannot be modified here.
      </p>
    </div>
  );
}
