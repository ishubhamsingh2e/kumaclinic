import { prisma } from "./db";

/**
 * Get role priority by role ID
 */
export async function getRolePriority(roleId: string): Promise<number> {
  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { priority: true },
  });
  return role?.priority ?? 0;
}

/**
 * Check if userRole has higher priority than targetRole
 * Higher priority number = higher rank
 * Returns true if userRole > targetRole priority (strictly greater)
 */
export async function canManageRole(
  userRoleId: string,
  targetRoleId: string
): Promise<boolean> {
  const [userPriority, targetPriority] = await Promise.all([
    getRolePriority(userRoleId),
    getRolePriority(targetRoleId),
  ]);

  return userPriority > targetPriority;
}

/**
 * Get user's role priority in a specific clinic
 */
export async function getUserRolePriority(
  userId: string,
  clinicId: string
): Promise<number | null> {
  const membership = await prisma.clinicMember.findUnique({
    where: {
      userId_clinicId: {
        userId,
        clinicId,
      },
    },
    include: {
      Role: {
        select: { priority: true },
      },
    },
  });

  return membership?.Role.priority ?? null;
}

/**
 * Check if a user can manage another user based on role hierarchy
 */
export async function canManageUser(
  actorUserId: string,
  targetUserId: string,
  clinicId: string
): Promise<boolean> {
  const [actorPriority, targetPriority] = await Promise.all([
    getUserRolePriority(actorUserId, clinicId),
    getUserRolePriority(targetUserId, clinicId),
  ]);

  if (actorPriority === null || targetPriority === null) {
    return false;
  }

  return actorPriority > targetPriority;
}
