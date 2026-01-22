import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { canManageRole } from "@/lib/role-hierarchy";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";

const changeRoleSchema = z.object({
  membershipId: z.string(),
  newRoleId: z.string(),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.activeClinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canManageTeam = await hasPermission(PERMISSIONS.TEAM_MANAGE);

    if (!canManageTeam) {
      return NextResponse.json(
        { error: "You don't have permission to manage team members" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = changeRoleSchema.parse(body);

    // Get the membership to update
    const membership = await prisma.clinicMember.findUnique({
      where: { id: validatedData.membershipId },
      include: { Role: true, User: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    if (membership.clinicId !== session.user.activeClinicId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get current user's membership
    const currentMembership = await prisma.clinicMember.findUnique({
      where: {
        userId_clinicId: {
          userId: session.user.id,
          clinicId: session.user.activeClinicId,
        },
      },
      include: { Role: true },
    });

    if (!currentMembership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get clinic to check ownership
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.activeClinicId },
      select: { ownerId: true },
    });

    const isOwner = clinic?.ownerId === session.user.id;

    // Can't change your own role unless you're owner
    if (membership.userId === session.user.id && !isOwner) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 403 }
      );
    }

    // Check role hierarchy - can only assign roles you can manage
    const canChangeToNewRole = await canManageRole(
      currentMembership.roleId,
      validatedData.newRoleId
    );

    if (!canChangeToNewRole && !isOwner) {
      return NextResponse.json(
        { error: "You cannot assign a role higher than yours" },
        { status: 403 }
      );
    }

    // Check if can manage current role
    const canManageCurrent = await canManageRole(
      currentMembership.roleId,
      membership.roleId
    );

    if (!canManageCurrent && !isOwner) {
      return NextResponse.json(
        { error: "You cannot manage users with a role equal to or higher than yours" },
        { status: 403 }
      );
    }

    // Update role
    await prisma.clinicMember.update({
      where: { id: validatedData.membershipId },
      data: { roleId: validatedData.newRoleId },
    });

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
    });
  } catch (error) {
    console.error("Error changing role:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to change role" },
      { status: 500 }
    );
  }
}
