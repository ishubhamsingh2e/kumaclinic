"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const AddClinicSchema = z.object({
  name: z.string().min(1, "Clinic name is required"),
  isBranch: z.boolean().default(false),
  parentClinicId: z.string().optional().nullable(),
  bio: z.string().optional(),
  coverImage: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  googleReviewsUrl: z.string().url().optional().or(z.literal("")),
});

export type AddClinicFormData = z.infer<typeof AddClinicSchema>;

export async function addNewClinic(data: AddClinicFormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const validated = AddClinicSchema.parse(data);

    // Generate a unique slug from clinic name
    const baseSlug = validated.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug exists and make it unique
    let slug = baseSlug;
    let counter = 1;
    while (
      await prisma.clinic.findUnique({
        where: { slug },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the clinic
    const clinic = await prisma.clinic.create({
      data: {
        name: validated.name,
        slug,
        isBranch: validated.isBranch,
        parentClinicId: validated.isBranch && validated.parentClinicId ? validated.parentClinicId : null,
        // Only set these fields for independent clinics
        bio: validated.isBranch ? null : (validated.bio || null),
        coverImage: validated.isBranch ? null : (validated.coverImage || null),
        profileImage: validated.isBranch ? null : (validated.profileImage || null),
        instagram: validated.isBranch ? null : (validated.instagram || null),
        facebook: validated.isBranch ? null : (validated.facebook || null),
        twitter: validated.isBranch ? null : (validated.twitter || null),
        linkedin: validated.isBranch ? null : (validated.linkedin || null),
        googleReviewsUrl: validated.isBranch ? null : (validated.googleReviewsUrl || null),
        // These fields are for all clinic types
        email: validated.email || null,
        phone: validated.phone || null,
        whatsapp: validated.whatsapp || null,
        address: validated.address || null,
        city: validated.city || null,
        state: validated.state || null,
        country: validated.country || null,
        zip: validated.zip || null,
        googleMapsUrl: validated.googleMapsUrl || null,
        ownerId: session.user.id,
        isPublished: false,
      },
    });

    // Get the highest priority role (usually CLINIC_MANAGER or similar)
    const highestRole = await prisma.role.findFirst({
      orderBy: {
        priority: "desc",
      },
      where: {
        name: {
          not: "ADMIN",
        },
      },
    });

    if (!highestRole) {
      return { error: "No roles found in the system" };
    }

    // Add the creator as a clinic member with the highest role
    await prisma.clinicMember.create({
      data: {
        userId: session.user.id,
        clinicId: clinic.id,
        roleId: highestRole.id,
      },
    });

    // Create default clinic settings
    await prisma.clinicSettings.create({
      data: {
        clinicId: clinic.id,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true, clinic };
  } catch (error) {
    console.error("Error creating clinic:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid clinic data" };
    }
    return { error: "Failed to create clinic" };
  }
}

export async function getUserClinics() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const clinics = await prisma.clinic.findMany({
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

    return { success: true, clinics };
  } catch (error) {
    console.error("Error fetching clinics:", error);
    return { error: "Failed to fetch clinics" };
  }
}

export async function updateClinic(clinicId: string, data: AddClinicFormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user has permission to edit this clinic
    const membership = await prisma.clinicMember.findUnique({
      where: {
        userId_clinicId: {
          userId: session.user.id,
          clinicId,
        },
      },
      include: {
        Clinic: true,
      },
    });

    if (!membership) {
      return { error: "You don't have access to this clinic" };
    }

    // Check if user is owner
    if (membership.Clinic.ownerId !== session.user.id) {
      return { error: "Only the clinic owner can edit clinic details" };
    }

    const validated = AddClinicSchema.parse(data);

    // Update the clinic
    const clinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        name: validated.name,
        parentClinicId: validated.isBranch && validated.parentClinicId ? validated.parentClinicId : null,
        // isBranch cannot be changed after creation
        // Only set these fields for independent clinics
        bio: validated.isBranch ? null : (validated.bio || null),
        coverImage: validated.isBranch ? null : (validated.coverImage || null),
        profileImage: validated.isBranch ? null : (validated.profileImage || null),
        instagram: validated.isBranch ? null : (validated.instagram || null),
        facebook: validated.isBranch ? null : (validated.facebook || null),
        twitter: validated.isBranch ? null : (validated.twitter || null),
        linkedin: validated.isBranch ? null : (validated.linkedin || null),
        googleReviewsUrl: validated.isBranch ? null : (validated.googleReviewsUrl || null),
        // These fields are for all clinic types
        email: validated.email || null,
        phone: validated.phone || null,
        whatsapp: validated.whatsapp || null,
        address: validated.address || null,
        city: validated.city || null,
        state: validated.state || null,
        country: validated.country || null,
        zip: validated.zip || null,
        googleMapsUrl: validated.googleMapsUrl || null,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true, clinic };
  } catch (error) {
    console.error("Error updating clinic:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid clinic data" };
    }
    return { error: "Failed to update clinic" };
  }
}

export async function deleteClinic(clinicId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Get user's membership to check ownership
    const membership = await prisma.clinicMember.findFirst({
      where: {
        userId: session.user.id,
        clinicId: clinicId,
      },
      include: {
        Clinic: true,
      },
    });

    if (!membership) {
      return { error: "Clinic not found" };
    }

    // Check if user is owner
    if (membership.Clinic.ownerId !== session.user.id) {
      return { error: "Only the clinic owner can delete the clinic" };
    }

    // If it's an independent clinic, check if user has at least one other independent clinic
    if (!membership.Clinic.isBranch) {
      const independentClinicsCount = await prisma.clinic.count({
        where: {
          ownerId: session.user.id,
          isBranch: false,
        },
      });

      if (independentClinicsCount <= 1) {
        return { error: "You must have at least one independent clinic. Create another clinic before deleting this one." };
      }
    }

    // Delete the clinic
    await prisma.clinic.delete({
      where: { id: clinicId },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Error deleting clinic:", error);
    return { error: "Failed to delete clinic" };
  }
}
