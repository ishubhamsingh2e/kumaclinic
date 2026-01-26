import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET - List all medicine groups with medicine counts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.medicineGroup.findMany({
      where: { doctorId: session.user.id },
      include: {
        _count: {
          select: { MedicineGroupItem: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error("Error fetching medicine groups:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch medicine groups" },
      { status: 500 }
    );
  }
}

// POST - Create a new medicine group
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const group = await prisma.medicineGroup.create({
      data: {
        doctorId: session.user.id,
        name: name.trim(),
      },
    });

    return NextResponse.json(group);
  } catch (error: any) {
    console.error("Error creating medicine group:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create medicine group" },
      { status: 500 }
    );
  }
}

// PUT - Update medicine group name
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name } = body;

    if (!id || !name || !name.trim()) {
      return NextResponse.json(
        { error: "Group ID and name are required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.medicineGroup.findUnique({
      where: { id },
      select: { doctorId: true },
    });

    if (!existing || existing.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Group not found or unauthorized" },
        { status: 404 }
      );
    }

    const group = await prisma.medicineGroup.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(group);
  } catch (error: any) {
    console.error("Error updating medicine group:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update medicine group" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a medicine group
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
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await prisma.medicineGroup.findUnique({
      where: { id },
      select: { doctorId: true },
    });

    if (!existing || existing.doctorId !== session.user.id) {
      return NextResponse.json(
        { error: "Group not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.medicineGroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting medicine group:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete medicine group" },
      { status: 500 }
    );
  }
}
