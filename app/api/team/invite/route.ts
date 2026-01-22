import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { canManageRole } from "@/lib/role-hierarchy";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { createNotification } from "@/lib/actions/notification";

const inviteSchema = z.object({
  email: z.string().email(),
  roleId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.activeClinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canInvite = await hasPermission(PERMISSIONS.TEAM_INVITE);

    if (!canInvite) {
      return NextResponse.json(
        { error: "You don't have permission to invite users" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = inviteSchema.parse(body);

    // Check if user is already a member
    const existingMember = await prisma.clinicMember.findFirst({
      where: {
        clinicId: session.user.activeClinicId,
        User: {
          email: validatedData.email,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this clinic" },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email: validatedData.email,
        clinicId: session.user.activeClinicId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Invitation already sent to this email" },
        { status: 400 }
      );
    }

    // Get current user's role for hierarchy check
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

    // Check role hierarchy
    const canInviteRole = await canManageRole(
      currentMembership.roleId,
      validatedData.roleId
    );

    if (!canInviteRole) {
      return NextResponse.json(
        { error: "You cannot invite users with a higher role than yours" },
        { status: 403 }
      );
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: validatedData.email,
        clinicId: session.user.activeClinicId,
        roleId: validatedData.roleId,
        inviterId: session.user.id,
        token: Math.random().toString(36).substring(2) + Date.now().toString(36),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: {
        Clinic: { select: { name: true } },
        Role: { select: { name: true } },
      },
    });

    // Check if user with this email exists and send notification
    const invitedUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true },
    });

    if (invitedUser) {
      await createNotification(
        invitedUser.id,
        "Team Invitation",
        `You've been invited to join ${invitation.Clinic.name} as ${invitation.Role.name}`,
        "INVITE_RECEIVED",
        invitation.id,
        `/dashboard/notifications`,
      );
    }

    // TODO: Send email notification for users not yet registered

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      invitation,
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}
