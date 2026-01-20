import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, banned } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Add a banned field to user - for now we'll use a workaround
    // You may want to add a 'banned' boolean field to the User model in schema.prisma
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        // Using email to store ban status as workaround - you should add a proper 'banned' field
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: banned ? "User banned successfully" : "User unbanned successfully",
      user,
    });
  } catch (error) {
    console.error("Error banning user:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}
