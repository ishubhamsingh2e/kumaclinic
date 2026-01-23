import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserManagementTab } from "@/components/settings/user-management-tab";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const activeClinicId = session.user.activeClinicId;

  if (!activeClinicId) {
    redirect("/dashboard/settings");
  }

  const canManageUsers = await hasPermission(PERMISSIONS.USER_MANAGE);

  if (!canManageUsers) {
    redirect("/dashboard/settings");
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: activeClinicId },
  });

  if (!clinic) {
    redirect("/dashboard/settings");
  }

  // Fetch all user's clinics for the clinics list
  const allUserClinics = await prisma.clinic.findMany({
    where: {
      ClinicMember: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      ClinicMember: {
        where: {
          userId: session.user.id,
        },
        include: {
          Role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Check team management permissions
  const canReadTeam = await hasPermission(PERMISSIONS.TEAM_READ);
  const canInviteTeam = await hasPermission(PERMISSIONS.TEAM_INVITE);
  const canManageTeam = await hasPermission(PERMISSIONS.TEAM_MANAGE);
  const canTransferOwnership = await hasPermission(
    PERMISSIONS.TEAM_TRANSFER_OWNERSHIP
  );

  if (!canReadTeam) {
    redirect("/dashboard/settings");
  }

  // Fetch team management data
  const [teamMembers, teamRoles, pendingInvitations] = await Promise.all([
    prisma.clinicMember.findMany({
      where: { clinicId: activeClinicId },
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
        Clinic: {
          select: {
            id: true,
            name: true,
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
        clinicId: activeClinicId,
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

  return (
    <UserManagementTab
      members={teamMembers}
      pendingInvitations={pendingInvitations}
      roles={teamRoles}
      clinic={clinic}
      allClinics={allUserClinics}
      currentUserId={session.user.id}
      currentUserRole={
        teamMembers.find((m) => m.userId === session.user.id)?.Role
      }
      isOwner={clinic.ownerId === session.user.id}
      canInvite={canInviteTeam}
      canManage={canManageTeam}
      canTransferOwnership={
        canTransferOwnership && clinic.ownerId === session.user.id
      }
    />
  );
}
