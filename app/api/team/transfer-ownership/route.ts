import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";

const transferOwnershipSchema = z.object({
  newOwnerId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.activeClinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permission
    const canTransfer = await hasPermission(PERMISSIONS.TEAM_TRANSFER_OWNERSHIP);

    if (!canTransfer) {
      return NextResponse.json(
        { error: "You don't have permission to transfer ownership" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = transferOwnershipSchema.parse(body);

    // Get clinic
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.activeClinicId },
      select: { id: true, ownerId: true, name: true },
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Only current owner can transfer ownership
    if (clinic.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can transfer ownership" },
        { status: 403 }
      );
    }

    // Check if new owner is a member of the clinic
    const newOwnerMembership = await prisma.clinicMember.findUnique({
      where: {
        userId_clinicId: {
          userId: validatedData.newOwnerId,
          clinicId: session.user.activeClinicId,
        },
      },
      include: { User: true },
    });

    if (!newOwnerMembership) {
      return NextResponse.json(
        { error: "New owner must be a member of the clinic" },
        { status: 400 }
      );
    }

    // Transfer ownership
    await prisma.clinic.update({
      where: { id: session.user.activeClinicId },
      data: { ownerId: validatedData.newOwnerId },
    });

    // TODO: Send notification to both parties

    return NextResponse.json({
      success: true,
      message: "Ownership transferred successfully",
    });
  } catch (error) {
    console.error("Error transferring ownership:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to transfer ownership" },
      { status: 500 }
    );
  }
}
