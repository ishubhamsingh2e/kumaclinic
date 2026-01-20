import { NextResponse } from "next/server";
import { RegisterClinicSchema } from "@/lib/schemas/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clinicName, userName, email, password, title } =
      RegisterClinicSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: userName,
          email: email,
          password: hashedPassword,
          title: title,
        },
      });

      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          ownerId: user.id,
        },
      });

      const managerRole = await tx.role.findUnique({
        where: { name: "CLINIC_MANAGER" },
      });

      if (!managerRole) {
        throw new Error("CLINIC_MANAGER role not found");
      }

      await tx.clinicMember.create({
        data: {
          userId: user.id,
          clinicId: clinic.id,
          roleId: managerRole.id,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { defaultClinicId: clinic.id },
      });
    });

    return NextResponse.json(
      { message: "Clinic registered successfully!" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 },
    );
  }
}
