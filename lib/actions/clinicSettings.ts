"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getClinicSettings({ clinicId }: { clinicId: string }) {
  let settings = await prisma.clinicSettings.findUnique({
    where: { clinicId },
  });

  if (!settings) {
    settings = await prisma.clinicSettings.create({
      data: {
        clinicId,
      },
    });
  }
  return { settings };
}

const timeSlotSettingsSchema = z.object({
  slotDurationInMin: z.coerce.number().int().positive(),
  clinicId: z.string(),
});

export async function updateClinicSettings(
  state: {
    message: string;
    type: "success" | "error" | "";
    errors?: any;
  },
  payload: unknown,
) {
  const validatedFields = timeSlotSettingsSchema.safeParse(payload);

  if (!validatedFields.success) {
    return {
      type: "error" as const,
      message: "Invalid form data.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { clinicId, slotDurationInMin } = validatedFields.data;

  try {
    await prisma.clinicSettings.update({
      where: { clinicId },
      data: { slotDurationInMin },
    });

    revalidatePath("/dashboard/settings");

    return {
      type: "success" as const,
      message: "Settings updated successfully.",
    };
  } catch (error) {
    return {
      type: "error" as const,
      message: "Failed to update settings.",
    };
  }
}
