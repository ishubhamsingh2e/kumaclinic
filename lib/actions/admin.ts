"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import { z } from "zod";

const createClinicSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
});

export async function createClinic(prevState: any, formData: FormData) {
  const canManage = await hasPermission(PERMISSIONS.CLINIC_OWNER_MANAGE);
  if (!canManage) {
    return { message: "Unauthorized", type: "error" };
  }

  const name = formData.get("name") as string;
  const parsed = createClinicSchema.safeParse({ name });

  if (!parsed.success) {
    return { message: parsed.error.issues[0].message, type: "error" };
  }

  try {
    await prisma.clinic.create({
      data: { name: parsed.data.name },
    });
    revalidatePath("/admin");
    return { message: "Clinic created successfully", type: "success" };
  } catch (error) {
    return { message: "Failed to create clinic", type: "error" };
  }
}

export async function assignClinicManagerRole(
  userId: string,
  clinicId: string,
) {
  const canManage = await hasPermission(PERMISSIONS.CLINIC_OWNER_MANAGE);
  if (!canManage) {
    return { message: "Unauthorized", type: "error" };
  }

  const clinicManagerRole = await prisma.role.findUnique({
    where: { name: "CLINIC_MANAGER" },
  });

  if (!clinicManagerRole) {
    return { message: "Clinic Manager role not found", type: "error" };
  }

  try {
    await prisma.clinicMember.upsert({
      where: {
        userId_clinicId: {
          userId,
          clinicId,
        },
      },
      update: {
        roleId: clinicManagerRole.id,
      },
      create: {
        userId,
        clinicId,
        roleId: clinicManagerRole.id,
      },
    });

    revalidatePath("/admin");
    return { message: "User assigned to clinic as manager", type: "success" };
  } catch (error) {
    return { message: "Failed to assign role", type: "error" };
  }
}
