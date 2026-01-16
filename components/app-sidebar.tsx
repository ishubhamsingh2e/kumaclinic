"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { LayoutDashboard, User, Shield, LockKeyhole, Building2, Settings } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { ClinicSwitcher } from "@/components/clinic-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();

  const navMain = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Patients",
      url: "/dashboard/patients",
      icon: User,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
  ];

  if (session?.user?.role === "CLINIC_MANAGER" || session?.user?.role === "SUPER_ADMIN") {
    navMain.push({
      title: "Clinic Profile",
      url: "/dashboard/clinic",
      icon: Building2,
    });
  }

  if (hasPermission(PERMISSIONS.CLINIC_OWNER_MANAGE)) {
    navMain.push({
      title: "Admin",
      url: "/admin",
      icon: Shield,
    });
  }

  if (
    hasPermission(PERMISSIONS.ROLE_MANAGE) ||
    hasPermission(PERMISSIONS.CLINIC_OWNER_MANAGE)
  ) {
    navMain.push({
      title: "Roles & Permissions",
      url: "/admin/roles",
      icon: LockKeyhole,
    });
  }

  const user = {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatar: session?.user?.image ?? "",
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <ClinicSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={[]} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
