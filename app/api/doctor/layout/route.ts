import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/doctor/layout - Get doctor's widget layout (or specialty default)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId") || session.user.id;
    const specialty = searchParams.get("specialty");

    // Get doctor's layout from prescriptionLayout JSON field
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { prescriptionLayout: true },
    });

    // If doctor has custom layout, return it
    if (doctor?.prescriptionLayout) {
      const layout = doctor.prescriptionLayout as any;
      
      // Fetch widget details for each widget in layout
      const widgetIds = layout.widgets?.map((w: any) => w.widgetId) || [];
      const widgets = await prisma.widget.findMany({
        where: { id: { in: widgetIds } },
      });

      // Merge layout config with widget details
      const widgetsWithDetails = layout.widgets?.map((layoutWidget: any) => {
        const widgetDetails = widgets.find(w => w.id === layoutWidget.widgetId);
        return {
          id: `${doctorId}-${layoutWidget.widgetId}`,
          widgetId: layoutWidget.widgetId,
          position: layoutWidget.position,
          visible: layoutWidget.visible,
          width: layoutWidget.width,
          columnSpan: layoutWidget.columnSpan,
          config: layoutWidget.config,
          Widget: widgetDetails,
        };
      }) || [];

      return NextResponse.json({
        source: "custom",
        widgets: widgetsWithDetails,
      });
    }

    // Otherwise, get specialty default widgets
    const where: any = {
      isActive: true,
      OR: [
        { specialty: specialty || null },
        { specialty: null }, // Include common widgets
      ],
    };

    const defaultWidgets = await prisma.widget.findMany({
      where,
      orderBy: [{ specialty: "asc" }, { name: "asc" }],
    });

    // Return default layout (not saved yet)
    const defaultLayout = defaultWidgets.map((widget, index) => ({
      Widget: widget,
      position: index + 1,
      visible: true,
      width: widget.defaultWidth,
      columnSpan: 6,
      config: null,
    }));

    return NextResponse.json({
      source: "default",
      widgets: defaultLayout,
    });
  } catch (error) {
    console.error("Error fetching doctor layout:", error);
    return NextResponse.json(
      { error: "Failed to fetch layout" },
      { status: 500 },
    );
  }
}

// POST /api/doctor/layout - Save doctor's widget layout
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { widgets } = body;
    const doctorId = session.user.id;

    if (!Array.isArray(widgets)) {
      return NextResponse.json(
        { error: "Invalid widgets array" },
        { status: 400 },
      );
    }

    // Store layout as JSON in user table
    const layout = {
      widgets: widgets.map((widget: any, index: number) => ({
        widgetId: widget.widgetId,
        position: index + 1,
        visible: widget.visible ?? true,
        width: widget.width || "full",
        columnSpan: widget.columnSpan || 6,
        config: widget.config || null,
      })),
      updatedAt: new Date().toISOString(),
    };

    await prisma.user.update({
      where: { id: doctorId },
      data: { prescriptionLayout: layout },
    });

    // Fetch widget details to return complete data
    const widgetIds = widgets.map((w: any) => w.widgetId);
    const widgetDetails = await prisma.widget.findMany({
      where: { id: { in: widgetIds } },
    });

    const savedWidgets = layout.widgets.map((w: any) => ({
      id: `${doctorId}-${w.widgetId}`,
      widgetId: w.widgetId,
      position: w.position,
      visible: w.visible,
      width: w.width,
      columnSpan: w.columnSpan,
      config: w.config,
      Widget: widgetDetails.find(wd => wd.id === w.widgetId),
    }));

    return NextResponse.json({
      message: "Layout saved successfully",
      widgets: savedWidgets,
    });
  } catch (error) {
    console.error("Error saving doctor layout:", error);
    return NextResponse.json(
      { error: "Failed to save layout" },
      { status: 500 },
    );
  }
}
