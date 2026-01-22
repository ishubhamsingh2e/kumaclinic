import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";

const cancelInvitationSchema = z.object({
  invitationId: z.string(),
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
        { error: "You don't have permission to manage invitations" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = cancelInvitationSchema.parse(body);

    // Get invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: validatedData.invitationId },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Check if invitation belongs to this clinic
    if (invitation.clinicId !== session.user.activeClinicId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete invitation
    await prisma.invitation.delete({
      where: { id: validatedData.invitationId },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to cancel invitation" },
      { status: 500 }
    );
  }
}
