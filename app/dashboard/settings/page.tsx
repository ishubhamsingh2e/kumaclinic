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
import { UserManagementTab } from "@/components/settings/user-management-tab";
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

  // Fetch user profile first (always needed for account tab)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      title: true,
      phone: true,
      dob: true,
      address: true,
      licenseNumber: true,
      slotDurationInMin: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  // Combine session user with dbUser for account content
  const user = {
    ...dbUser,
    activeClinicId: session.user.activeClinicId,
    role: session.user.role,
    permissions: session.user.permissions,
  };

  // If no active clinic, show only account tab
  if (!activeClinicId) {
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

          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <ConnectedAccounts />
            </CardContent>
          </Card>
        </div>
      </div>
    );

    return (
      <DashboardView title="Settings">
        <SettingsTabsClient
          accountContent={accountContent}
          usersContent={null}
          canManageUsers={false}
          clinicManagementContent={null}
          isManager={false}
          integrationsContent={null}
        />
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

  const canManageUsers = await hasPermission(PERMISSIONS.USER_MANAGE);

  let users: UserWithMappedFields[] = [];
  let roles: Role[] = [];
  let invitations: InvitationWithRelations[] = [];
  let teamMembers: any[] = [];
  let teamRoles: any[] = [];
  let pendingInvitations: any[] = [];
  const ownerId: string | null = clinic.ownerId;

  // Check team management permissions
  const canReadTeam = await hasPermission(PERMISSIONS.TEAM_READ);
  const canInviteTeam = await hasPermission(PERMISSIONS.TEAM_INVITE);
  const canManageTeam = await hasPermission(PERMISSIONS.TEAM_MANAGE);
  const canTransferOwnership = await hasPermission(PERMISSIONS.TEAM_TRANSFER_OWNERSHIP);

  if (canReadTeam && user.activeClinicId) {
    const [usersData, rolesData, invitationsData, teamData, allRoles, teamInvitations] = await Promise.all([
      getUsers(user.activeClinicId),
      getRoles(),
      getPendingInvitations(),
      // Fetch team management data
      prisma.clinicMember.findMany({
        where: { clinicId: user.activeClinicId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          Role: {
            select: {
              id: true,
              name: true,
              priority: true,
            },
          },
        },
        orderBy: {
          Role: {
            priority: "desc",
          },
        },
      }),
      // All roles for team management
      prisma.role.findMany({
        orderBy: {
          priority: "desc",
        },
      }),
      // Pending invitations for team management
      prisma.invitation.findMany({
        where: {
          clinicId: user.activeClinicId,
          status: "PENDING",
        },
        include: {
          Role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);
    users = usersData;
    roles = rolesData;
    invitations = invitationsData;
    teamMembers = teamData;
    teamRoles = allRoles;
    pendingInvitations = teamInvitations;
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
        {user.title === "Dr." && (
          <Card>
            <CardHeader>
              <CardTitle>Doctor Availability</CardTitle>
              <CardDescription>
                Set your availability for each clinic you are a member of.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DoctorAvailabilityManager
                slotDuration={user.slotDurationInMin || 30}
              />
            </CardContent>
          </Card>
        )}
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

        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectedAccounts />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const usersContent = canManageUsers ? (
    <UserManagementTab
      members={teamMembers}
      pendingInvitations={pendingInvitations}
      roles={teamRoles}
      clinic={clinic}
      currentUserId={user.id}
      currentUserRole={
        teamMembers.find((m) => m.userId === user.id)?.Role
      }
      isOwner={clinic.ownerId === user.id}
      canInvite={canInviteTeam}
      canManage={canManageTeam}
      canTransferOwnership={canTransferOwnership && (clinic.ownerId === user.id)}
    />
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
