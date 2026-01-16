"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { hasPermission } from "@/lib/rbac";
import { PERMISSIONS } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const updateUserSchema = z.object({
  title: z.string().optional(),
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters long." })
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  dob: z.string().optional(),
  licenseNumber: z.string().optional(),
});

const createClinicUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().min(1, "Role is required"),
});

export async function updateUser(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { message: "Not authenticated", type: "error" };
  }

  const title = formData.get("title")?.toString();
  const name = formData.get("name")?.toString();
  const email = formData.get("email")?.toString();
  const phone = formData.get("phone")?.toString();
  const address = formData.get("address")?.toString();
  const dob = formData.get("dob")?.toString();
  const licenseNumber = formData.get("licenseNumber")?.toString();
  const imageFile = formData.get("image") as File | null;

  const parsed = updateUserSchema.safeParse({
    title,
    name,
    email,
    phone,
    address,
    dob,
    licenseNumber,
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues.map((e) => e.message).join(", "),
      type: "error",
    };
  }

  const dataToUpdate: any = {};

  if (parsed.data.title !== undefined) dataToUpdate.title = parsed.data.title;

  if (parsed.data.name !== undefined) dataToUpdate.name = parsed.data.name;

  if (parsed.data.email !== undefined) dataToUpdate.email = parsed.data.email;

  if (parsed.data.phone !== undefined) dataToUpdate.phone = parsed.data.phone;

  if (parsed.data.address !== undefined)
    dataToUpdate.address = parsed.data.address;

  if (parsed.data.dob) {
    const date = new Date(parsed.data.dob);

    if (!isNaN(date.getTime())) {
      dataToUpdate.dob = date;
    }
  } else if (parsed.data.dob === "") {
    dataToUpdate.dob = null;
  }

  if (parsed.data.licenseNumber !== undefined)
    dataToUpdate.licenseNumber = parsed.data.licenseNumber;

  // Handle Image Upload
  if (imageFile && imageFile.size > 0 && imageFile.type.startsWith("image/")) {
    try {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Ensure directory exists
      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const filename = `${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.-]/g, "")}`;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      dataToUpdate.image = `/uploads/${filename}`;
    } catch (error) {
      console.error("Image upload failed:", error);
      return { message: "Failed to upload image.", type: "error" };
    }
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return { message: "No changes to update.", type: "info" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: dataToUpdate,
    });

    revalidatePath("/dashboard/settings");

    return { message: "Profile updated successfully.", type: "success" };
  } catch (error: any) {
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return { message: "This email is already in use.", type: "error" };
    }
    return { message: "Failed to update profile.", type: "error" };
  }
}

export async function updatePassword(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { message: "Not authenticated", type: "error" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (newPassword !== confirmPassword) {
    return { message: "New passwords do not match", type: "error" };
  }

  if (newPassword.length < 6) {
    return { message: "Password must be at least 6 characters", type: "error" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || !user.password) {
      return {
        message: "User not found or using OAuth provider",
        type: "error",
      };
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return { message: "Incorrect current password", type: "error" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { message: "Password updated successfully", type: "success" };
  } catch (error) {
    return { message: "Failed to update password", type: "error" };
  }
}

export async function createClinicUser(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.activeClinicId) {
    return { message: "Unauthorized", type: "error" };
  }

  const hasAccess = await hasPermission(PERMISSIONS.USER_MANAGE);
  if (!hasAccess) {
    return { message: "Insufficient permissions", type: "error" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const roleId = formData.get("roleId") as string;

  const parsed = createClinicUserSchema.safeParse({
    name,
    email,
    password,
    roleId,
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0].message, type: "error" };
  }

  try {
    const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

    await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: parsed.data.email },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            name: parsed.data.name,
            email: parsed.data.email,
            password: hashedPassword,
          },
        });
      }

      await tx.clinicMember.create({
        data: {
          userId: user.id,
          clinicId: session.user.activeClinicId!,
          roleId: parsed.data.roleId,
        },
      });
    });

    revalidatePath("/dashboard/users");
    return { message: "User added to clinic successfully", type: "success" };
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return {
        message: "User is already a member of this clinic",
        type: "error",
      };
    }
    return { message: "Failed to add user to clinic", type: "error" };
  }
}

export async function updateClinicUserRole(userId: string, roleId: string) {
  const session = await auth();
  const hasAccess = await hasPermission(PERMISSIONS.USER_MANAGE);
  if (!hasAccess || !session?.user?.activeClinicId)
    return { message: "Unauthorized", type: "error" };

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.activeClinicId },
    });

    if (userId === clinic?.ownerId) {
      return { message: "Cannot change the role of the clinic owner", type: "error" };
    }

    if (userId === session.user.id) {
      return { message: "Cannot change your own role to prevent loss of access", type: "error" };
    }

    await prisma.clinicMember.update({
      where: {
        userId_clinicId: {
          userId,
          clinicId: session.user.activeClinicId,
        },
      },
      data: { roleId },
    });
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/settings");
    return { message: "User role updated", type: "success" };
  } catch (error) {
    return { message: "Failed to update role", type: "error" };
  }
}

export async function deleteClinicUser(userId: string) {
  const session = await auth();
  const hasAccess = await hasPermission(PERMISSIONS.USER_MANAGE);
  if (!hasAccess || !session?.user?.activeClinicId)
    return { message: "Unauthorized", type: "error" };

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: session.user.activeClinicId },
    });

    if (userId === clinic?.ownerId) {
      return { message: "Cannot remove the clinic owner", type: "error" };
    }

    if (userId === session.user.id) {
      return { message: "Cannot remove yourself from the clinic", type: "error" };
    }

    await prisma.clinicMember.delete({
      where: {
        userId_clinicId: {
          userId,
          clinicId: session.user.activeClinicId,
        },
      },
    });
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/settings");
    return { message: "User removed from clinic", type: "success" };
  } catch (error) {
    return { message: "Failed to remove user", type: "error" };
  }
}
