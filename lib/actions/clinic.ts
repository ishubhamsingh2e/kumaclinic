"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateClinicProfile(data: unknown) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.activeClinicId) {
    return { error: "No active clinic" };
  }

  try {
    await prisma.clinic.update({
      where: {
        id: session.user.activeClinicId,
      },
      data: data as any,
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating clinic:", error);
    return { error: "Failed to update clinic" };
  }
}

export async function acceptInvitation(invitationId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.email) {
    return { error: "Unauthorized" };
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { Role: true },
    });

    if (!invitation) {
      return { error: "Invitation not found" };
    }

    if (invitation.email !== session.user.email) {
      return { error: "This invitation is not for you" };
    }

    if (invitation.status !== "PENDING") {
      return { error: "This invitation is no longer valid" };
    }

    // Check if user is already a member
    const existingMember = await prisma.clinicMember.findUnique({
      where: {
        userId_clinicId: {
          userId: session.user.id,
          clinicId: invitation.clinicId,
        },
      },
    });

    if (existingMember) {
      return { error: "You are already a member of this clinic" };
    }

    // Create membership and update invitation
    await prisma.$transaction([
      prisma.clinicMember.create({
        data: {
          userId: session.user.id,
          clinicId: invitation.clinicId,
          roleId: invitation.roleId,
        },
      }),
      prisma.invitation.update({
        where: { id: invitationId },
        data: {
          status: "ACCEPTED",
        },
      }),
    ]);

    revalidatePath("/dashboard/notifications");
    revalidatePath("/dashboard");
    return { success: true, clinicId: invitation.clinicId };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return { error: "Failed to accept invitation" };
  }
}

export async function declineInvitation(invitationId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.email) {
    return { error: "Unauthorized" };
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return { error: "Invitation not found" };
    }

    if (invitation.email !== session.user.email) {
      return { error: "This invitation is not for you" };
    }

    if (invitation.status !== "PENDING") {
      return { error: "This invitation is no longer valid" };
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: "REJECTED",
      },
    });

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error declining invitation:", error);
    return { error: "Failed to decline invitation" };
  }
}
