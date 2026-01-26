import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "File must contain headers and at least one row" },
        { status: 400 }
      );
    }

    // Skip header row
    const dataLines = lines.slice(1);

    const medicines = [];
    const errors = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      // Parse CSV line (handle quoted fields)
      const fields = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const values = fields.map((field) =>
        field.replace(/^"|"$/g, "").replace(/""/g, '"').trim()
      );

      if (values.length < 2) {
        errors.push(`Row ${i + 2}: Missing required fields`);
        continue;
      }

      const [
        type,
        medicineName,
        dosage,
        administration,
        unit,
        time,
        when,
        where_field,
        genericName,
        frequency,
        duration,
        qty,
        notes,
      ] = values;

      if (!type || !medicineName) {
        errors.push(`Row ${i + 2}: Type and Medicine Name are required`);
        continue;
      }

      medicines.push({
        doctorId: session.user.id,
        type,
        medicineName,
        dosage: dosage || null,
        administration: administration || null,
        unit: unit || null,
        time: time || null,
        when: when || null,
        where: where_field || null,
        genericName: genericName || null,
        frequency: frequency || null,
        duration: duration || null,
        qty: qty || null,
        notes: notes || null,
      });
    }

    if (medicines.length === 0) {
      return NextResponse.json(
        { error: "No valid medicines to import", errors },
        { status: 400 }
      );
    }

    const result = await prisma.medicine.createMany({
      data: medicines,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      imported: result.count,
      total: dataLines.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error importing medicines:", error);
    return NextResponse.json(
      { error: error.message || "Failed to import medicines" },
      { status: 500 }
    );
  }
}
