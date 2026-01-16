import { auth } from "@/lib/auth";
import { UserProfileForm } from "@/components/forms/user-profile-form";
import { UserPasswordForm } from "@/components/forms/user-password-form";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { NotificationSettings } from "@/components/settings/notification-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { getPendingInvitations } from "@/lib/actions/clinic";
import { UserManagementClient } from "@/components/admin/user-management-client";
import DashboardView from "@/components/dashboard-view";
import { SettingsTabsClient } from "@/components/settings/settings-tabs-client";

async function getUsers(activeClinicId: string) {
  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          clinicId: activeClinicId,
        },
      },
    },
    include: {
      memberships: {
        where: {
          clinicId: activeClinicId,
        },
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      },
    },
  });

  return users.map((u) => ({
    ...u,
    role: u.memberships[0]?.role || null,
    roleId: u.memberships[0]?.roleId || null,
    status: "ACTIVE" as const,
  }));
}

async function getRoles() {
  return prisma.role.findMany({
    where: {
      name: {
        not: "SUPER_ADMIN",
      },
    },
  });
}

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [dbUser, canManageUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
    }),
    hasPermission(PERMISSIONS.USER_MANAGE),
  ]);

  if (!dbUser) {
    redirect("/login");
  }

  // Combine session user (which has the role, permissions, and activeClinicId)
  // with dbUser (which has the profile fields)
  const user = {
    ...dbUser,
    activeClinicId: session.user.activeClinicId,
    role: session.user.role,
    permissions: session.user.permissions,
  };

  let users: any[] = [];
  let roles: any[] = [];
  let invitations: any[] = [];
  let ownerId: string | null = null;

  if (canManageUsers && user.activeClinicId) {
    const [usersData, rolesData, invitationsData, clinicData] = await Promise.all([
      getUsers(user.activeClinicId),
      getRoles(),
      getPendingInvitations(),
      prisma.clinic.findUnique({
        where: { id: user.activeClinicId },
      }),
    ]);
    users = usersData;
    roles = rolesData;
    invitations = invitationsData;
    ownerId = clinicData?.ownerId || null;
  }

  const accountContent = (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Main Profile Column */}
      <div className="space-y-6 md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This is how others will see you on the site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserProfileForm user={user} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectedAccounts />
          </CardContent>
        </Card>
      </div>

      {/* Side Column */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserPasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationSettings />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const usersContent = (
    <div className="space-y-4">
      <UserManagementClient
        users={users}
        roles={roles}
        ownerId={ownerId}
        invitations={invitations.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          roleId: i.roleId,
          status: "PENDING" as const,
          name: "Pending Invitation",
          image: null,
        }))}
      />
    </div>
  );

  return (
    <DashboardView title="Settings">
      <SettingsTabsClient
        accountContent={accountContent}
        usersContent={usersContent}
        canManageUsers={canManageUsers}
      />
    </DashboardView>
  );
}