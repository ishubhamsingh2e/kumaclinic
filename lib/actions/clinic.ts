"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { createNotification } from "./notification";

export async function switchClinic(clinicId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const membership = await prisma.clinicMember.findUnique({
    where: {
      userId_clinicId: {
        userId: session.user.id,
        clinicId,
      },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this clinic");
  }

  revalidatePath("/");
  return { success: true };
}

export async function getMyInvitations() {
  const session = await auth();
  if (!session?.user?.email) return [];

  return prisma.invitation.findMany({
    where: {
      email: session.user.email,
      status: "PENDING",
    },
    include: {
      clinic: true,
      role: true,
    },
  });
}

export async function acceptInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
  });

  if (!invitation || invitation.email !== session.user.email) {
    throw new Error("Invitation not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.clinicMember.create({
      data: {
        userId: session.user.id,
        clinicId: invitation.clinicId,
        roleId: invitation.roleId,
      },
    });

    await tx.invitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED" },
    });
    
    // Set as default if not set
    const user = await tx.user.findUnique({ where: { id: session.user.id } });
    if (!user?.defaultClinicId) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { defaultClinicId: invitation.clinicId },
      });
    }
  });

  // Notify the inviter
  await createNotification(
      invitation.inviterId,
      "Invitation Accepted",
      `${session.user.name || session.user.email} has accepted your invitation.`,
      "INVITE_ACCEPTED"
  );

  revalidatePath("/dashboard");
  return { success: true };
}

export async function setDefaultClinic(clinicId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const isManager = session.user.role === "CLINIC_MANAGER" || session.user.role === "SUPER_ADMIN";
  if (!isManager) {
    throw new Error("Only clinic managers can set default clinics");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { defaultClinicId: clinicId },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function inviteUserToClinic(email: string, roleId: string) {
  const session = await auth();
  if (!session?.user?.activeClinicId) {
    throw new Error("No active clinic");
  }

  const isManager = session.user.role === "CLINIC_MANAGER" || session.user.role === "SUPER_ADMIN";
  if (!isManager) {
    throw new Error("Unauthorized: Only clinic managers can invite users");
  }
  
  const invitation = await prisma.invitation.create({
    data: {
      email,
      clinicId: session.user.activeClinicId,
      roleId,
      inviterId: session.user.id,
      token: Math.random().toString(36).substring(2, 15), // Basic token
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Check if the user exists to notify them
  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (invitedUser) {
      await createNotification(
          invitedUser.id,
          "New Invitation",
          `You have been invited to join a clinic.`,
          "INVITE_RECEIVED"
      );
  }

  // In a real app, send an email here.
  
  revalidatePath("/dashboard/users");
  return { success: true, invitation };
}

export async function cancelInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.activeClinicId) {
    return { message: "No active clinic", type: "error" };
  }

  const isManager =
    session.user.role === "CLINIC_MANAGER" ||
    session.user.role === "SUPER_ADMIN";
  if (!isManager) {
    return { message: "Unauthorized", type: "error" };
  }

  try {
    await prisma.invitation.delete({
      where: {
        id: invitationId,
        clinicId: session.user.activeClinicId,
        status: "PENDING",
      },
    });
    revalidatePath("/dashboard/settings");
    return { message: "Invitation cancelled", type: "success" };
  } catch (error) {
    return { message: "Failed to cancel invitation", type: "error" };
  }
}

export async function transferClinicOwnership(newOwnerId: string) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.activeClinicId) {
    return { message: "Unauthorized", type: "error" };
  }

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.activeClinicId },
    });

    if (clinic?.ownerId !== session.user.id) {
      return { message: "Only the clinic owner can transfer ownership", type: "error" };
    }

    // Verify new owner is a member
    const membership = await prisma.clinicMember.findUnique({
      where: {
        userId_clinicId: {
          userId: newOwnerId,
          clinicId: session.user.activeClinicId,
        },
      },
    });

    if (!membership) {
      return { message: "New owner must be a member of the clinic", type: "error" };
    }

    await prisma.clinic.update({
      where: { id: session.user.activeClinicId },
      data: { ownerId: newOwnerId },
    });

    revalidatePath("/dashboard/settings");
    return { message: "Ownership transferred successfully", type: "success" };
  } catch (error) {
    return { message: "Failed to transfer ownership", type: "error" };
  }
}

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

// ... existing code ...

export async function updateClinicSettings(prevState: any, formData: FormData) {
  const session = await auth();
  const activeClinicId = session?.user?.activeClinicId;
  if (!activeClinicId) return { message: "No active clinic", type: "error" };

  const isManager = session.user.role === "CLINIC_MANAGER" || session.user.role === "SUPER_ADMIN";
  if (!isManager) return { message: "Unauthorized", type: "error" };

  const name = formData.get("name") as string;
  const bio = formData.get("bio") as string;
  const slug = (formData.get("slug") as string)?.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
  const googleReviewsUrl = formData.get("googleReviewsUrl") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const whatsapp = formData.get("whatsapp") as string;
  const isPublished = formData.get("isPublished") === "true";

  const coverImageFile = formData.get("coverImage") as File | null;
  const profileImageFile = formData.get("profileImage") as File | null;

  const dataToUpdate: any = {
    name,
    bio,
    slug: slug || null,
    googleReviewsUrl,
    email,
    phone,
    whatsapp,
    isPublished,
  };

  // Handle Images
  const uploadDir = join(process.cwd(), "public", "uploads", "clinics", activeClinicId);
  await mkdir(uploadDir, { recursive: true });

  if (coverImageFile && coverImageFile.size > 0) {
    const filename = `cover-${Date.now()}-${coverImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
    const bytes = await coverImageFile.arrayBuffer();
    await writeFile(join(uploadDir, filename), Buffer.from(bytes));
    dataToUpdate.coverImage = `/uploads/clinics/${activeClinicId}/${filename}`;
  }

  if (profileImageFile && profileImageFile.size > 0) {
    const filename = `profile-${Date.now()}-${profileImageFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
    const bytes = await profileImageFile.arrayBuffer();
    await writeFile(join(uploadDir, filename), Buffer.from(bytes));
    dataToUpdate.profileImage = `/uploads/clinics/${activeClinicId}/${filename}`;
  }

  try {
    await prisma.clinic.update({
      where: { id: activeClinicId },
      data: dataToUpdate,
    });
    revalidatePath("/dashboard/clinic");
    return { message: "Clinic settings updated", type: "success" };
  } catch (error: any) {
    if (error.code === 'P2002') return { message: "Slug is already in use", type: "error" };
    return { message: "Failed to update clinic", type: "error" };
  }
}

export async function upsertClinicLocation(locationId: string | null, data: any) {
  const session = await auth();
  const activeClinicId = session?.user?.activeClinicId;
  if (!activeClinicId) return { message: "No active clinic", type: "error" };

  const isManager = session.user.role === "CLINIC_MANAGER" || session.user.role === "SUPER_ADMIN";
  if (!isManager) return { message: "Unauthorized", type: "error" };

  try {
    if (locationId) {
      await prisma.clinicLocation.update({
        where: { id: locationId },
        data: { ...data, clinicId: activeClinicId },
      });
    } else {
      await prisma.clinicLocation.create({
        data: { ...data, clinicId: activeClinicId },
      });
    }
    revalidatePath("/dashboard/clinic");
    return { message: "Location saved", type: "success" };
  } catch (error) {
    return { message: "Failed to save location", type: "error" };
  }
}

export async function deleteClinicLocation(locationId: string) {
  const session = await auth();
  if (!session?.user?.activeClinicId) return { message: "Unauthorized", type: "error" };

  try {
    await prisma.clinicLocation.delete({
      where: { id: locationId, clinicId: session.user.activeClinicId },
    });
    revalidatePath("/dashboard/clinic");
    return { message: "Location deleted", type: "success" };
  } catch (error) {
    return { message: "Failed to delete location", type: "error" };
  }
}

export async function getPendingInvitations() {
  const session = await auth();
  if (!session?.user?.activeClinicId) {
    return [];
  }

  return prisma.invitation.findMany({
    where: {
      clinicId: session.user.activeClinicId,
      status: "PENDING",
    },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
      inviter: true,
    },
  });
}


