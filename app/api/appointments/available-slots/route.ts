import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDoctorAvailability } from "@/lib/actions/bookings";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const clinicId = searchParams.get("clinicId");
    const dateStr = searchParams.get("date");

    if (!doctorId || !clinicId || !dateStr) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const date = new Date(dateStr);
    const result = await getDoctorAvailability(doctorId, date, clinicId);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Format slots as time strings (e.g., "09:00 - 09:30")
    const formattedSlots = result.slots.map((slot) => {
      const startTime = new Date(slot.start).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const endTime = new Date(slot.end).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${startTime} - ${endTime}`;
    });

    return NextResponse.json({ slots: formattedSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch available slots" },
      { status: 500 },
    );
  }
}
