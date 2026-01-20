"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { LayoutDashboard, User, Calendar } from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import { ClinicSwitcher } from "@/components/sidebar/clinic-switcher";
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
      permission: PERMISSIONS.DASHBOARD_READ,
    },
    {
      title: "Patients",
      url: "/dashboard/patients",
      icon: User,
      permission: PERMISSIONS.PATIENT_READ,
    },
    {
      title: "Calendar",
      url: "/dashboard/calendar",
      icon: Calendar,
      permission: PERMISSIONS.APPOINTMENT_READ,
    },
  ];

  const user = {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatar: session?.user?.image ?? "",
    title: session?.user?.title ?? "",
  };

  const filteredNav = navMain.filter(
    (item) => !item.permission || hasPermission(item.permission),
  );

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <ClinicSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNav} />
        <NavSecondary items={[]} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
