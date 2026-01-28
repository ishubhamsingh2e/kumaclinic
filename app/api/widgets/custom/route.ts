import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST /api/widgets/custom - Create custom widget
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, fieldsJson, validationJson } = body;
    const doctorId = session.user.id;

    if (!title || !fieldsJson) {
      return NextResponse.json(
        { error: "Title and fields are required" },
        { status: 400 }
      );
    }

    // Validate field types
    const allowedFieldTypes = [
      "text",
      "textarea",
      "number",
      "date",
      "time",
      "datetime",
      "dropdown",
      "radio",
      "checkbox",
      "toggle",
    ];

    for (const field of fieldsJson) {
      if (!allowedFieldTypes.includes(field.type)) {
        return NextResponse.json(
          { error: `Invalid field type: ${field.type}` },
          { status: 400 }
        );
      }
    }

    // Create widget master entry
    const widget = await prisma.widget.create({
      data: {
        name: title,
        type: "custom",
        componentName: null,
        specialty: null, // Custom widgets are doctor-specific
        description: `Custom widget created by doctor`,
        defaultWidth: "full",
        icon: "PlusSquare",
        isActive: true,
      },
    });

    // Create custom widget definition
    const customWidget = await prisma.customWidget.create({
      data: {
        doctorId,
        widgetId: widget.id,
        title,
        fieldsJson,
        validationJson: validationJson || {},
      },
      include: {
        Widget: true,
      },
    });

    // Add to doctor's layout
    const maxPosition = await prisma.doctorWidget.findMany({
      where: { doctorId },
      orderBy: { position: "desc" },
      take: 1,
    });

    const nextPosition = maxPosition.length > 0 ? maxPosition[0].position + 1 : 1;

    await prisma.doctorWidget.create({
      data: {
        doctorId,
        widgetId: widget.id,
        position: nextPosition,
        visible: true,
        width: "full",
      },
    });

    return NextResponse.json(customWidget, { status: 201 });
  } catch (error) {
    console.error("Error creating custom widget:", error);
    return NextResponse.json(
      { error: "Failed to create custom widget" },
      { status: 500 }
    );
  }
}

// GET /api/widgets/custom - List doctor's custom widgets
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = session.user.id;

    const customWidgets = await prisma.customWidget.findMany({
      where: { doctorId },
      include: {
        Widget: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(customWidgets);
  } catch (error) {
    console.error("Error fetching custom widgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom widgets" },
      { status: 500 }
    );
  }
}
