import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { canManageUser } from "@/lib/role-hierarchy";

const removeMemberSchema = z.object({
  membershipId: z.string(),
});

export async function DELETE(req: NextRequest) {
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
    const validatedData = removeMemberSchema.parse(body);

    // Get the membership to remove
    const membership = await prisma.clinicMember.findUnique({
      where: { id: validatedData.membershipId },
      include: { User: true },
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

    // Get clinic to check ownership
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.activeClinicId },
      select: { ownerId: true },
    });

    const isOwner = clinic?.ownerId === session.user.id;

    // Can't remove yourself
    if (membership.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 403 }
      );
    }

    // Can't remove the owner
    if (membership.userId === clinic?.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove the clinic owner" },
        { status: 403 }
      );
    }

    // Check if user can manage this member based on role hierarchy
    if (!isOwner) {
      const canRemove = await canManageUser(
        session.user.id,
        membership.userId,
        session.user.activeClinicId
      );

      if (!canRemove) {
        return NextResponse.json(
          { error: "You cannot remove users with a role equal to or higher than yours" },
          { status: 403 }
        );
      }
    }

    // Delete the membership
    await prisma.clinicMember.delete({
      where: { id: validatedData.membershipId },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
