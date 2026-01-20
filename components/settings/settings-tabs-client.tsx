"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsTabsClientProps {
  accountContent: React.ReactNode;
  usersContent: React.ReactNode;
  canManageUsers: boolean;
  clinicManagementContent: React.ReactNode;
  isManager: boolean;
  integrationsContent: React.ReactNode;
}

export function SettingsTabsClient({
  accountContent,
  usersContent,
  canManageUsers,
  clinicManagementContent,
  isManager,
  integrationsContent,
}: SettingsTabsClientProps) {
  return (
    <Tabs value="account" className="space-y-4">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        {isManager && (
          <TabsTrigger value="clinic">Clinic Management</TabsTrigger>
        )}
        {canManageUsers && (
          <TabsTrigger value="users">User Management</TabsTrigger>
        )}
        {isManager && (
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="account">{accountContent}</TabsContent>
      {isManager && (
        <TabsContent value="clinic">{clinicManagementContent}</TabsContent>
      )}
      {canManageUsers && (
        <TabsContent value="users">{usersContent}</TabsContent>
      )}
      {isManager && (
        <TabsContent value="integrations">{integrationsContent}</TabsContent>
      )}
    </Tabs>
  );
}
