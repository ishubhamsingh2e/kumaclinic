"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsNavProps {
  hasClinic: boolean;
  isManager: boolean;
  canManageUsers: boolean;
}

export function SettingsNav({
  hasClinic,
  isManager,
  canManageUsers,
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
    <Tabs value={getCurrentValue()} onValueChange={handleValueChange} className="w-full">
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
