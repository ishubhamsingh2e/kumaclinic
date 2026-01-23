import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { Gender, MaritalStatus, BloodGroup } from "@prisma/client";

const CreatePatientSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  name: z.string().min(1, "Name is required"),
  gender: z.nativeEnum(Gender),
  dob: z.string().transform((val) => new Date(val)),
  is_dob_estimate: z.boolean(),
  city: z.string().optional(),
  address: z.string().optional(),
  marital_status: z.nativeEnum(MaritalStatus).optional(),
  blood_group: z.nativeEnum(BloodGroup).optional(),
  spouse_name: z.string().optional(),
  referred_by: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  how_did_you_hear_about_us: z.string().optional(),
  care_of: z.string().optional(),
  occupation: z.string().optional(),
  tag: z.string().optional(),
  alternative_phone: z.string().optional(),
  aadhar_number: z.string().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = CreatePatientSchema.parse(body);

    // Check if email is provided and already exists
    if (validatedData.email && validatedData.email !== "") {
      const existingEmail = await prisma.patient.findFirst({
        where: { email: validatedData.email },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: "Patient with this email already exists" },
          { status: 400 },
        );
      }
    }

    // Check if aadhar is provided and already exists
    if (validatedData.aadhar_number && validatedData.aadhar_number !== "") {
      const existingAadhar = await prisma.patient.findFirst({
        where: { aadhar_number: validatedData.aadhar_number },
      });

      if (existingAadhar) {
        return NextResponse.json(
          { error: "Patient with this Aadhar number already exists" },
          { status: 400 },
        );
      }
    }

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        ...validatedData,
        email: validatedData.email === "" ? null : validatedData.email,
        aadhar_number:
          validatedData.aadhar_number === ""
            ? null
            : validatedData.aadhar_number,
      },
    });

    return NextResponse.json(patient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error creating patient:", error);
    return NextResponse.json(
      { error: "Failed to create patient" },
      { status: 500 },
    );
  }
}
