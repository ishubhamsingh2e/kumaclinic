import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - Get all medicines in a group
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Verify group ownership
    const group = await prisma.medicineGroup.findUnique({
      where: { id: groupId },
      select: { doctorId: true },
    });

    if (!group || group.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Group not found or unauthorized" },
        { status: 404 }
      );
    }

    const items = await prisma.medicineGroupItem.findMany({
      where: { groupId },
      include: {
        Medicine: true,
      },
      orderBy: {
        Medicine: {
          medicineName: "asc",
        },
      },
    });

    return NextResponse.json(items.map((item) => item.Medicine));
  } catch (error: any) {
    console.error("Error fetching group medicines:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch group medicines" },
      { status: 500 }
    );
  }
}

// POST - Add medicines to a group
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const body = await req.json();
    const { medicineIds } = body;

    if (!medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
      return NextResponse.json(
        { error: "Medicine IDs are required" },
        { status: 400 }
      );
    }

    // Verify group ownership
    const group = await prisma.medicineGroup.findUnique({
      where: { id: groupId },
      select: { doctorId: true },
    });

    if (!group || group.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Group not found or unauthorized" },
        { status: 404 }
      );
    }

    // Verify all medicines belong to the doctor
    const medicines = await prisma.medicine.findMany({
      where: {
        id: { in: medicineIds },
        doctorId: session.user.id,
      },
      select: { id: true },
    });

    if (medicines.length !== medicineIds.length) {
      return NextResponse.json(
        { error: "Some medicines not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create group items (will skip duplicates due to unique constraint)
    const items = await prisma.$transaction(
      medicineIds.map((medicineId: string) =>
        prisma.medicineGroupItem.upsert({
          where: {
            groupId_medicineId: {
              groupId,
              medicineId,
            },
          },
          create: {
            groupId,
            medicineId,
          },
          update: {},
        })
      )
    );

    return NextResponse.json({ success: true, count: items.length });
  } catch (error: any) {
    console.error("Error adding medicines to group:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add medicines to group" },
      { status: 500 }
    );
  }
}

// DELETE - Remove medicine from group
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const { searchParams } = new URL(req.url);
    const medicineId = searchParams.get("medicineId");

    if (!medicineId) {
      return NextResponse.json(
        { error: "Medicine ID is required" },
        { status: 400 }
      );
    }

    // Verify group ownership
    const group = await prisma.medicineGroup.findUnique({
      where: { id: groupId },
      select: { doctorId: true },
    });

    if (!group || group.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Group not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.medicineGroupItem.deleteMany({
      where: {
        groupId,
        medicineId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing medicine from group:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove medicine from group" },
      { status: 500 }
    );
  }
}
