import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ADMIN
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, permissionIds } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Role name is required" },
        { status: 400 },
      );
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role with this name already exists" },
        { status: 400 },
      );
    }

    // Create role with permissions
    const role = await prisma.role.create({
      data: {
        name,
        permissions: {
          connect: permissionIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        permissions: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Role created successfully",
      role,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ADMIN
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { roleId, name, permissionIds } = await req.json();

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 },
      );
    }

    // If name is being updated, check if it's unique
    if (name) {
      const existingRole = await prisma.role.findFirst({
        where: {
          name,
          id: { not: roleId },
        },
      });

      if (existingRole) {
        return NextResponse.json(
          { error: "Role with this name already exists" },
          { status: 400 },
        );
      }
    }

    // Update role name and permissions
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name && { name }),
        permissions: {
          set: permissionIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        permissions: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
      role,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is ADMIN
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { roleId, transferToRoleId } = await req.json();

    if (!roleId) {
      return NextResponse.json(
        { error: "Role ID is required" },
        { status: 400 },
      );
    }

    // Get the role to check if it has users
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Store user count for later use
    const userCount = role._count.members;

    // If role has users and no transfer role is provided, return error
    if (userCount > 0 && !transferToRoleId) {
      return NextResponse.json(
        {
          error: "Cannot delete role with users. Please transfer users first.",
        },
        { status: 400 },
      );
    }

    // If transfer role is provided, verify it exists
    if (transferToRoleId) {
      const transferRole = await prisma.role.findUnique({
        where: { id: transferToRoleId },
      });

      if (!transferRole) {
        return NextResponse.json(
          { error: "Transfer role not found" },
          { status: 404 },
        );
      }
    }

    // Use transaction to transfer users and delete role
    await prisma.$transaction(async (tx) => {
      // Transfer users to new role if specified
      if (transferToRoleId && userCount > 0) {
        // Update clinic members to new role
        await tx.clinicMember.updateMany({
          where: { roleId },
          data: { roleId: transferToRoleId },
        });
      }

      // Delete the role
      await tx.role.delete({
        where: { id: roleId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Role deleted successfully",
      transferredUsers: userCount,
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 },
    );
  }
}
