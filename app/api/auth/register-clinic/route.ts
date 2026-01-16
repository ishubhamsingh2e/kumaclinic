import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerClinicSchema = z.object({
  clinicName: z.string().min(3, "Clinic name must be at least 3 characters"),
  userName: z.string().min(3, "User name must be at least 3 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = registerClinicSchema.safeParse(body);

    if (!result.success) {
      return new NextResponse(result.error.issues[0].message, { status: 400 });
    }

    const { clinicName, userName, email, password } = result.data;

    const clinicManagerRole = await prisma.role.findUnique({
      where: { name: "CLINIC_MANAGER" },
    });

    if (!clinicManagerRole) {
      return new NextResponse("System error: CLINIC_MANAGER role not found", {
        status: 500,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Transaction to create clinic and user linked to it
    await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });

      if (!user) {
        user = await tx.user.create({
          data: {
            name: userName,
            email,
            password: hashedPassword,
          },
        });
      }

      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          ownerId: user.id, // Set the owner
        },
      });

      await tx.clinicMember.create({
        data: {
          userId: user.id,
          clinicId: clinic.id,
          roleId: clinicManagerRole.id,
        },
      });

      // Update defaultClinicId if user doesn't have one
      if (!user.defaultClinicId) {
        await tx.user.update({
          where: { id: user.id },
          data: { defaultClinicId: clinic.id },
        });
      }
    });

    return NextResponse.json({
      message: "Clinic and account created successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
