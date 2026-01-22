import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      name,
      email,
      phone,
      dob,
      address,
      licenseNumber,
      image,
      slotDurationInMin,
    } = body;

    // Check if email is already taken by another user
    if (email && email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== session.user.id) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 },
        );
      }
    }

    // Check if slot duration is changing
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { slotDurationInMin: true },
    });

    const isSlotDurationChanging =
      slotDurationInMin !== undefined &&
      parseInt(slotDurationInMin) !== currentUser?.slotDurationInMin;

    // Update user profile
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;
    if (address !== undefined) updateData.address = address;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (image !== undefined) updateData.image = image;
    if (slotDurationInMin !== undefined)
      updateData.slotDurationInMin = slotDurationInMin
        ? parseInt(slotDurationInMin)
        : null;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    // If slot duration changed, delete all doctor availability slots
    if (isSlotDurationChanging) {
      await prisma.doctorAvailability.deleteMany({
        where: { doctorId: session.user.id },
      });
    }

    return NextResponse.json({
      success: true,
      message: isSlotDurationChanging
        ? "Profile updated and availability slots reset"
        : "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
