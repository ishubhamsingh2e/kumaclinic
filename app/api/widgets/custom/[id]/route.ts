import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/widgets/custom/[id] - Update custom widget
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, fieldsJson, validationJson } = body;
    const doctorId = session.user.id;

    // Check ownership
    const customWidget = await prisma.customWidget.findUnique({
      where: { id },
    });

    if (!customWidget || customWidget.doctorId !== doctorId) {
      return NextResponse.json(
        { error: "Custom widget not found" },
        { status: 404 }
      );
    }

    // Update custom widget
    const updated = await prisma.customWidget.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(fieldsJson && { fieldsJson }),
        ...(validationJson !== undefined && { validationJson }),
      },
      include: {
        Widget: true,
      },
    });

    // Update widget name if title changed
    if (title) {
      await prisma.widget.update({
        where: { id: customWidget.widgetId },
        data: { name: title },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating custom widget:", error);
    return NextResponse.json(
      { error: "Failed to update custom widget" },
      { status: 500 }
    );
  }
}

// DELETE /api/widgets/custom/[id] - Delete custom widget
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const doctorId = session.user.id;

    // Check ownership
    const customWidget = await prisma.customWidget.findUnique({
      where: { id },
    });

    if (!customWidget || customWidget.doctorId !== doctorId) {
      return NextResponse.json(
        { error: "Custom widget not found" },
        { status: 404 }
      );
    }

    // Delete custom widget values
    await prisma.customWidgetValue.deleteMany({
      where: { widgetId: id },
    });

    // Delete doctor widget layout entries
    await prisma.doctorWidget.deleteMany({
      where: { widgetId: customWidget.widgetId },
    });

    // Delete custom widget
    await prisma.customWidget.delete({
      where: { id },
    });

    // Delete widget master
    await prisma.widget.delete({
      where: { id: customWidget.widgetId },
    });

    return NextResponse.json({
      message: "Custom widget deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom widget:", error);
    return NextResponse.json(
      { error: "Failed to delete custom widget" },
      { status: 500 }
    );
  }
}
