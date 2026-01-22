"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";

/**
 * Get weekly off days for the current doctor at a specific clinic
 */
export async function getWeeklyOffDays(clinicId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  try {
    const offDays = await prisma.doctorWeeklyOffDay.findMany({
      where: {
        doctorId: session.user.id,
        clinicId,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    });

    return { offDays: offDays.map((d) => d.dayOfWeek) };
  } catch (error) {
    console.error("Error fetching weekly off days:", error);
    return { error: "Failed to fetch weekly off days" };
  }
}

/**
 * Update weekly off days for the current doctor at a specific clinic
 */
export async function updateWeeklyOffDays(
  clinicId: string,
  dayOfWeekArray: number[]
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  // Validate day of week values (0-6)
  if (dayOfWeekArray.some((d) => d < 0 || d > 6)) {
    return { error: "Invalid day of week value" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Delete all existing weekly off days for this doctor/clinic
      await tx.doctorWeeklyOffDay.deleteMany({
        where: {
          doctorId: session.user.id,
          clinicId,
        },
      });

      // Create new weekly off days
      if (dayOfWeekArray.length > 0) {
        await tx.doctorWeeklyOffDay.createMany({
          data: dayOfWeekArray.map((dayOfWeek) => ({
            doctorId: session.user.id!,
            clinicId,
            dayOfWeek,
          })),
        });
      }
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating weekly off days:", error);
    return { error: "Failed to update weekly off days" };
  }
}

/**
 * Get specific off days for the current doctor at a specific clinic
 */
export async function getSpecificOffDays(
  clinicId: string,
  startDate?: Date,
  endDate?: Date
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  try {
    const whereClause: any = {
      doctorId: session.user.id,
      clinicId,
    };

    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      whereClause.date = {
        gte: startDate,
      };
    }

    const offDays = await prisma.doctorSpecificOffDay.findMany({
      where: whereClause,
      orderBy: {
        date: "asc",
      },
    });

    return { offDays };
  } catch (error) {
    console.error("Error fetching specific off days:", error);
    return { error: "Failed to fetch specific off days" };
  }
}

/**
 * Add specific off day(s) for the current doctor at a specific clinic
 */
export async function addSpecificOffDays(
  clinicId: string,
  dates: Date[],
  reason?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  if (dates.length === 0) {
    return { error: "No dates provided" };
  }

  try {
    // Normalize dates to start of day (00:00:00)
    const normalizedDates = dates.map((date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    // Use createMany with skipDuplicates to avoid errors if date already exists
    await prisma.doctorSpecificOffDay.createMany({
      data: normalizedDates.map((date) => ({
        doctorId: session.user.id!,
        clinicId,
        date,
        reason: reason || null,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/dashboard/settings");
    return { success: true, count: normalizedDates.length };
  } catch (error) {
    console.error("Error adding specific off days:", error);
    return { error: "Failed to add specific off days" };
  }
}

/**
 * Delete a specific off day
 */
export async function deleteSpecificOffDay(clinicId: string, date: Date) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  try {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    await prisma.doctorSpecificOffDay.deleteMany({
      where: {
        doctorId: session.user.id,
        clinicId,
        date: normalizedDate,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error deleting specific off day:", error);
    return { error: "Failed to delete specific off day" };
  }
}

/**
 * Check if a specific date is marked as off for the current doctor at a clinic
 */
export async function isDateOff(clinicId: string, date: Date) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  try {
    const dayOfWeek = date.getDay();

    // Check weekly off day
    const weeklyOffDay = await prisma.doctorWeeklyOffDay.findUnique({
      where: {
        doctorId_clinicId_dayOfWeek: {
          doctorId: session.user.id,
          clinicId,
          dayOfWeek,
        },
      },
    });

    if (weeklyOffDay) {
      return { isOff: true, reason: "Weekly off day" };
    }

    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check specific off day
    const specificOffDay = await prisma.doctorSpecificOffDay.findUnique({
      where: {
        doctorId_clinicId_date: {
          doctorId: session.user.id,
          clinicId,
          date: normalizedDate,
        },
      },
    });

    if (specificOffDay) {
      return {
        isOff: true,
        reason: specificOffDay.reason || "Specific off day",
      };
    }

    return { isOff: false };
  } catch (error) {
    console.error("Error checking if date is off:", error);
    return { error: "Failed to check date" };
  }
}

/**
 * Get all off days in a date range (combines weekly + specific)
 */
export async function getOffDaysInRange(
  clinicId: string,
  startDate: Date,
  endDate: Date
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "User not authenticated" };
  }

  try {
    // Get weekly off days
    const weeklyOffDays = await prisma.doctorWeeklyOffDay.findMany({
      where: {
        doctorId: session.user.id,
        clinicId,
      },
    });

    const weeklyOffDayNumbers = weeklyOffDays.map((d) => d.dayOfWeek);

    // Get specific off days in range
    const specificOffDays = await prisma.doctorSpecificOffDay.findMany({
      where: {
        doctorId: session.user.id,
        clinicId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Generate all dates in range that are off
    const offDates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();

      // Check if this day is a weekly off day
      if (weeklyOffDayNumbers.includes(dayOfWeek)) {
        offDates.push(new Date(current));
      }

      current.setDate(current.getDate() + 1);
    }

    // Add specific off days
    specificOffDays.forEach((offDay) => {
      const date = new Date(offDay.date);
      // Check if not already added by weekly off day
      if (!offDates.some((d) => d.getTime() === date.getTime())) {
        offDates.push(date);
      }
    });

    return { offDates: offDates.sort((a, b) => a.getTime() - b.getTime()) };
  } catch (error) {
    console.error("Error getting off days in range:", error);
    return { error: "Failed to get off days" };
  }
}
