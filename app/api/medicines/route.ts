import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - List medicines with pagination and search
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    
    const skip = (page - 1) * limit;

    const where = {
      doctorId: session.user.id,
      ...(search ? {
        OR: [
          { medicineName: { contains: search, mode: "insensitive" as const } },
          { genericName: { contains: search, mode: "insensitive" as const } },
          { type: { contains: search, mode: "insensitive" as const } },
        ],
      } : {}),
    };

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where,
        skip,
        take: limit,
        orderBy: { medicineName: "asc" },
      }),
      prisma.medicine.count({ where }),
    ]);

    return NextResponse.json({
      medicines,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching medicines:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch medicines" },
      { status: 500 }
    );
  }
}

// POST - Create a new medicine
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      medicineName,
      dosage,
      administration,
      unit,
      time,
      when,
      where,
      genericName,
      frequency,
      duration,
      qty,
      notes,
    } = body;

    if (!type || !medicineName) {
      return NextResponse.json(
        { error: "Type and Medicine Name are required" },
        { status: 400 }
      );
    }

    const medicine = await prisma.medicine.create({
      data: {
        doctorId: session.user.id,
        type,
        medicineName,
        dosage,
        administration,
        unit,
        time,
        when,
        where,
        genericName,
        frequency,
        duration,
        qty,
        notes,
      },
    });

    return NextResponse.json(medicine);
  } catch (error: any) {
    console.error("Error creating medicine:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create medicine" },
      { status: 500 }
    );
  }
}

// PUT - Update a medicine
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.medicine.findUnique({
      where: { id },
      select: { doctorId: true },
    });

    if (!existing || existing.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Medicine not found or unauthorized" },
        { status: 404 }
      );
    }

    const medicine = await prisma.medicine.update({
      where: { id },
      data,
    });

    return NextResponse.json(medicine);
  } catch (error: any) {
    console.error("Error updating medicine:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update medicine" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a medicine
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.medicine.findUnique({
      where: { id },
      select: { doctorId: true },
    });

    if (!existing || existing.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Medicine not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.medicine.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting medicine:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete medicine" },
      { status: 500 }
    );
  }
}
