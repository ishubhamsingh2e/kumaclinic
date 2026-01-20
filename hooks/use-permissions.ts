"use client";

import { useSession } from "next-auth/react";
import { Permission } from "@/lib/permissions";

export function usePermissions() {
  const { data: session } = useSession();
  const userPermissions = session?.user?.permissions ?? [];

  const hasPermission = (permission: Permission | Permission[]) => {
    const requiredPermissions = Array.isArray(permission)
      ? permission
      : [permission];
    return requiredPermissions.every((p) => userPermissions.includes(p));
  };

  return { hasPermission };
}