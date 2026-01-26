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

    const medicines = await prisma.medicine.findMany({
      where: { doctorId: session.user.id },
      orderBy: { medicineName: "asc" },
    });

    // Create CSV content
    const headers = [
      "Type",
      "Medicine Name",
      "Dosage",
      "Administration",
      "Unit",
      "Time",
      "When",
      "Where",
      "Generic Name",
      "Frequency",
      "Duration",
      "Qty",
      "Notes",
    ];

    const rows = medicines.map((m) => [
      m.type,
      m.medicineName,
      m.dosage || "",
      m.administration || "",
      m.unit || "",
      m.time || "",
      m.when || "",
      m.where || "",
      m.genericName || "",
      m.frequency || "",
      m.duration || "",
      m.qty || "",
      m.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="medicines-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("Error exporting medicines:", error);
    return NextResponse.json(
      { error: error.message || "Failed to export medicines" },
      { status: 500 },
    );
  }
}
