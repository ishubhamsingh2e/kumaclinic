"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation"; // Added import
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { LayoutDashboard, User, CalendarCheck } from "lucide-react";

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
  const [pendingCount, setPendingCount] = React.useState<number | null>(null);
  const pathname = usePathname(); // Get current pathname

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("/api/appointments/count");
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.count);
        }
      } catch (error) {
        console.error("Failed to fetch appointment count", error);
      }
    };

    fetchCount();
  }, []);

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
      title: "Appointments",
      url: "/dashboard/appointments",
      icon: CalendarCheck,
      permission: PERMISSIONS.APPOINTMENT_READ,
      badge: pendingCount,
    },
  ];

  const user = {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatar: session?.user?.image ?? "",
    title: session?.user?.title ?? "",
  };

  const filteredNav = navMain
    .filter((item) => !item.permission || hasPermission(item.permission))
    .map((item) => ({
      ...item,
      isActive:
        pathname === item.url ||
        (item.url !== "/dashboard" && pathname.startsWith(item.url)),
    }));

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
