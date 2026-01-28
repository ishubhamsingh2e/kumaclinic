import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/widgets - List all available widgets (filtered by specialty)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get("specialty");
    const includeCommon = searchParams.get("includeCommon") !== "false"; // default true

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // If specialty is provided, get specialty-specific + common widgets
    if (specialty) {
      if (includeCommon) {
        where.OR = [
          { specialty: specialty },
          { specialty: null }, // Common widgets
        ];
      } else {
        where.specialty = specialty;
      }
    } else if (!includeCommon) {
      // Only common widgets
      where.specialty = null;
    }

    const widgets = await prisma.widget.findMany({
      where,
      orderBy: [
        { specialty: "asc" }, // Common (null) first
        { name: "asc" },
      ],
    });

    return NextResponse.json(widgets);
  } catch (error) {
    console.error("Error fetching widgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch widgets" },
      { status: 500 }
    );
  }
}
