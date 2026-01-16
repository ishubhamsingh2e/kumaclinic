"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsTabsClientProps {
  accountContent: React.ReactNode;
  usersContent: React.ReactNode;
  canManageUsers: boolean;
}

export function SettingsTabsClient({
  accountContent,
  usersContent,
  canManageUsers,
}: SettingsTabsClientProps) {
  const [tab, setTab] = useQueryState("tab", {
    defaultValue: "account",
    shallow: false,
  });

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        {canManageUsers && (
          <TabsTrigger value="users">User Management</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="account">{accountContent}</TabsContent>
      {canManageUsers && (
        <TabsContent value="users">{usersContent}</TabsContent>
      )}
    </Tabs>
  );
}
