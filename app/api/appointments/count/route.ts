import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.activeClinicId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const count = await prisma.booking.count({
      where: {
        doctorId: session.user.id,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("[APPOINTMENTS_COUNT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
