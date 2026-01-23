import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone || phone.length < 10) {
      return NextResponse.json({ patients: [] });
    }

    const patients = await prisma.patient.findMany({
      where: { phone },
      select: {
        id: true,
        name: true,
        phone: true,
        gender: true,
        dob: true,
        city: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Error searching patients:", error);
    return NextResponse.json(
      { error: "Failed to search patients" },
      { status: 500 }
    );
  }
}
