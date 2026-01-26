"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MedicinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const getCurrentValue = () => {
    if (pathname === "/dashboard/settings/medicines/groups") return "groups";
    return "medicines";
  };

  const handleValueChange = (value: string) => {
    if (value === "groups") {
      router.push("/dashboard/settings/medicines/groups");
    } else {
      router.push("/dashboard/settings/medicines");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Medicine Library</h2>
          <p className="text-sm text-muted-foreground">
            Manage your personal medicine templates and groups
          </p>
        </div>
      </div>

      <Tabs value={getCurrentValue()} onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="medicines">All Medicines</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
        </TabsList>
      </Tabs>

      <div>{children}</div>
    </div>
  );
}
