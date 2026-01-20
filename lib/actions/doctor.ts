"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "../auth";

export async function getDoctorClinics() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  const clinics = await prisma.clinic.findMany({
    where: {
      ClinicMember: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      DoctorAvailability: {
        where: {
          doctorId: session.user.id,
        },
      },
    },
  });

  return { clinics };
}

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
});

const updateAvailabilitySchema = z.object({
  clinicId: z.string(),
  availability: z.array(availabilitySchema),
});

export async function updateDoctorAvailability(payload: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  const validatedFields = updateAvailabilitySchema.safeParse(payload);

  if (!validatedFields.success) {
    return {
      error: "Invalid form data",
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { clinicId, availability } = validatedFields.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.doctorAvailability.deleteMany({
        where: {
          doctorId: session.user.id,
          clinicId: clinicId,
        },
      });

      if (availability.length > 0) {
        await tx.doctorAvailability.createMany({
          data: availability.map((item) => ({
            ...item,
            doctorId: session.user.id!,
            clinicId: clinicId,
          })),
        });
      }
    });

    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    return { error: "Failed to update availability" };
  }
}
