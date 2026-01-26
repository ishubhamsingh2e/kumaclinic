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

    // Fetch all bookings for the current user across all clinics
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { doctorId: session.user.id }, // Bookings where user is the doctor
          {
            Clinic: {
              ClinicMember: {
                some: {
                  userId: session.user.id, // Bookings at clinics where user is a member
                },
              },
            },
          },
        ],
      },
      include: {
        Patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            gender: true,
            dob: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            title: true,
          },
        },
        Clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: {
        start: "asc",
      },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
