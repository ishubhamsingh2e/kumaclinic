"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsNavProps {
  hasClinic: boolean;
  isManager: boolean;
  canManageUsers: boolean;
  isDoctor?: boolean;
}

export function SettingsNav({
  hasClinic,
  isManager,
  canManageUsers,
  isDoctor = false,
}: SettingsNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    {
      title: "Account",
      href: "/dashboard/settings",
      value: "account",
      show: true,
    },
    {
      title: "Medicine Library",
      href: "/dashboard/settings/medicines",
      value: "medicines",
      show: isDoctor,
    },
    {
      title: "Prescription Settings",
      href: "/dashboard/settings/prescription",
      value: "prescription",
      show: isDoctor,
    },
    {
      title: "Print Settings",
      href: "/dashboard/settings/print-settings",
      value: "print-settings",
      show: isDoctor,
    },
    {
      title: "Clinic Management",
      href: "/dashboard/settings/clinic",
      value: "clinic",
      show: hasClinic && isManager,
    },
    {
      title: "User Management",
      href: "/dashboard/settings/users",
      value: "users",
      show: hasClinic && canManageUsers,
    },
    {
      title: "Integrations",
      href: "/dashboard/settings/integrations",
      value: "integrations",
      show: hasClinic && isManager,
    },
  ];

  // Determine current value based on pathname
  const getCurrentValue = () => {
    if (pathname === "/dashboard/settings") return "account";
    if (pathname?.startsWith("/dashboard/settings/medicines")) return "medicines";
    if (pathname?.startsWith("/dashboard/settings/prescription")) return "prescription";
    if (pathname === "/dashboard/settings/print-settings") return "print-settings";
    if (pathname === "/dashboard/settings/clinic") return "clinic";
    if (pathname === "/dashboard/settings/users") return "users";
    if (pathname === "/dashboard/settings/integrations") return "integrations";
    return "account";
  };

  const handleValueChange = (value: string) => {
    const item = navItems.find((item) => item.value === value);
    if (item) {
      router.push(item.href);
    }
  };

  return (
    <Tabs
      value={getCurrentValue()}
      onValueChange={handleValueChange}
      className="w-full"
    >
      <TabsList>
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.title}
            </TabsTrigger>
          ))}
      </TabsList>
    </Tabs>
  );
}
