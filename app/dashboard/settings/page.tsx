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
import { SettingsTabsClient } from "@/components/settings/settings-tabs-client";
import { ClinicManagementTab } from "@/components/settings/clinic-management-tab";
import { IntegrationsTab } from "@/components/settings/integrations-tab";
import { DoctorAvailabilityManager } from "@/components/settings/doctor-availability-manager";
import DashboardView from "@/components/dashboard-view";
import { getClinicSettings } from "@/lib/actions/clinicSettings";
import { Role, Invitation, Clinic } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { User as PrismaUser } from "@prisma/client";

type UserWithMappedFields = PrismaUser & {
  role:
    | (Role & {
        permissions: { name: string; id: string; description: string | null }[];
      })
    | null;
  roleId: string | null;
  status: "ACTIVE";
  memberships: Array<{
    id: string;
    userId: string;
    clinicId: string;
    roleId: string;
    createdAt: Date;
    updatedAt: Date;
    Role: Role & {
      permissions: { name: string; id: string; description: string | null }[];
    };
  }>;
};

type InvitationWithRelations = Invitation & {
  Role: Role & {
    permissions: { id: string; name: string; description: string | null }[];
  };
  User: PrismaUser;
  Clinic: Clinic;
};

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
          Role: {
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
    role: u.memberships[0]?.Role || null,
    roleId: u.memberships[0]?.roleId || null,
    status: "ACTIVE" as const,
  }));
}

async function getRoles() {
  return prisma.role.findMany({
    where: {
      name: {
        not: "ADMIN",
      },
    },
  });
}

async function getPendingInvitations() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.activeClinicId) {
    return [];
  }

  return prisma.invitation.findMany({
    where: {
      clinicId: session.user.activeClinicId,
      status: "PENDING",
    },
    include: {
      Role: {
        include: {
          permissions: true,
        },
      },
      User: true,
      Clinic: true,
    },
  });
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const activeClinicId = session.user.activeClinicId;

  if (!activeClinicId) {
    return (
      <DashboardView title="Settings">
        <p>No active clinic selected.</p>
      </DashboardView>
    );
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: activeClinicId },
    include: {
      ClinicLocation: true,
    },
  });

  if (!clinic) {
    return (
      <DashboardView title="Settings">
        <p>Clinic not found.</p>
      </DashboardView>
    );
  }

  const { settings: clinicSettings } = await getClinicSettings({
    clinicId: activeClinicId,
  });

  const isManager =
    session.user.role === "CLINIC_MANAGER" || session.user.role === "ADMIN";

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

  let users: UserWithMappedFields[] = [];
  let roles: Role[] = [];
  let invitations: InvitationWithRelations[] = [];
  const ownerId: string | null = clinic.ownerId;

  if (canManageUsers && user.activeClinicId) {
    const [usersData, rolesData, invitationsData] = await Promise.all([
      getUsers(user.activeClinicId),
      getRoles(),
      getPendingInvitations(),
    ]);
    users = usersData;
    roles = rolesData;
    invitations = invitationsData;
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
            <UserProfileForm
              user={user}
              slotDuration={clinicSettings?.slotDurationInMin}
            />
          </CardContent>
        </Card>
        {user.title === "Dr." && (
          <Card>
            <CardHeader>
              <CardTitle>Doctor Availability</CardTitle>
              <CardDescription>
                Set your availability for each clinic you are a member of.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DoctorAvailabilityManager />
            </CardContent>
          </Card>
        )}

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

  const usersContent = canManageUsers ? (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage users and roles for your clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Total Users: {users.length}
            </p>
            <p className="text-sm text-muted-foreground">
              Pending Invitations: {invitations.length}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  ) : null;

  const clinicManagementContent = (
    <ClinicManagementTab clinic={clinic} settings={clinicSettings ?? null} />
  );

  const integrationsContent = <IntegrationsTab />;

  return (
    <DashboardView title="Settings">
      <SettingsTabsClient
        accountContent={accountContent}
        usersContent={usersContent}
        canManageUsers={canManageUsers}
        clinicManagementContent={clinicManagementContent}
        isManager={isManager}
        integrationsContent={integrationsContent}
      />
    </DashboardView>
  );
}
