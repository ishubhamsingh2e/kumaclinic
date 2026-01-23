"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BookingStatus } from "@prisma/client";
// import { sendBookingConfirmationEmail } from "./send-email";

const CreateBookingSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  clinicId: z.string().min(1, "Clinic is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  start: z.coerce.date(),
  end: z.coerce.date(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateBookingFormData = z.infer<typeof CreateBookingSchema>;

export async function createBooking(data: CreateBookingFormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const validated = CreateBookingSchema.parse(data);

    // Check if doctor is available at this time
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        doctorId: validated.doctorId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        OR: [
          {
            AND: [
              { start: { lte: validated.start } },
              { end: { gt: validated.start } },
            ],
          },
          {
            AND: [
              { start: { lt: validated.end } },
              { end: { gte: validated.end } },
            ],
          },
          {
            AND: [
              { start: { gte: validated.start } },
              { end: { lte: validated.end } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      return { error: "This time slot is already booked" };
    }

    // Get patient name for title
    const patient = await prisma.patient.findUnique({
      where: { id: validated.patientId },
      select: { name: true },
    });

    if (!patient) {
      return { error: "Patient not found" };
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        patientId: validated.patientId,
        clinicId: validated.clinicId,
        doctorId: validated.doctorId,
        start: validated.start,
        end: validated.end,
        title: `Consultation: ${patient.name}`,
        reason: validated.reason || null,
        notes: validated.notes || null,
        status: "PENDING",
      },
      include: {
        Patient: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
    });

    // Send confirmation email to doctor
    // if (booking.User?.email) {
    //   await sendBookingConfirmationEmail(booking);
    // }

    revalidatePath("/dashboard/appointments");

    return { success: true, booking };
  } catch (error) {
    console.error("Error creating booking:", error);
    if (error instanceof z.ZodError) {
      return { error: "Invalid booking data" };
    }
    return { error: "Failed to create booking" };
  }
}

interface GetBookingsFilters {
  clinicId?: string;
  doctorId?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
}

export async function getBookings(filters?: GetBookingsFilters) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const where: any = {};

    if (filters?.clinicId) {
      where.clinicId = filters.clinicId;
    }

    if (filters?.doctorId) {
      where.doctorId = filters.doctorId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate && filters?.endDate) {
      where.start = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        Patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            gender: true,
            dob: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            title: true,
          },
        },
        Clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: {
        start: "asc",
      },
    });

    return { success: true, bookings };
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return { error: "Failed to fetch bookings" };
  }
}

export async function getBookingById(id: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        Patient: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            title: true,
            phone: true,
          },
        },
        Clinic: true,
      },
    });

    if (!booking) {
      return { error: "Booking not found" };
    }

    return { success: true, booking };
  } catch (error) {
    console.error("Error fetching booking:", error);
    return { error: "Failed to fetch booking" };
  }
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  cancelReason?: string
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(status === "CANCELLED" && cancelReason
          ? { cancelReason }
          : {}),
      },
      include: {
        Patient: true,
        User: true,
        Clinic: true,
      },
    });

    revalidatePath("/dashboard/appointments");

    return { success: true, booking };
  } catch (error) {
    console.error("Error updating booking status:", error);
    return { error: "Failed to update booking" };
  }
}

export async function getDoctorAvailability(
  doctorId: string,
  date: Date,
  clinicId: string
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    // Get doctor's slot duration
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { slotDurationInMin: true },
    });

    if (!doctor) {
      return { error: "Doctor not found" };
    }

    const slotDuration = doctor.slotDurationInMin || 30;

    // Get doctor's availability for this clinic and day
    const dayOfWeek = date.getDay();
    
    // Check if this day is a weekly off day for the doctor
    const weeklyOffDay = await prisma.doctorWeeklyOffDay.findFirst({
      where: {
        doctorId,
        clinicId,
        dayOfWeek,
      },
    });

    if (weeklyOffDay) {
      return { success: true, slots: [] };
    }

    const availability = await prisma.doctorAvailability.findFirst({
      where: {
        doctorId,
        clinicId,
        dayOfWeek,
      },
    });

    if (!availability) {
      return { success: true, slots: [] };
    }

    // Get existing bookings for this day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        doctorId,
        clinicId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        start: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        start: true,
        end: true,
      },
    });

    // Check if doctor has any off days on this date
    const specificOffDay = await prisma.doctorSpecificOffDay.findFirst({
      where: {
        doctorId,
        clinicId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (specificOffDay) {
      return { success: true, slots: [] };
    }

    // Generate available slots
    const slots: { start: Date; end: Date }[] = [];
    const startTime = new Date(date);
    const [startHour, startMin] = availability.startTime.split(":").map(Number);
    startTime.setHours(startHour, startMin, 0, 0);

    const endTime = new Date(date);
    const [endHour, endMin] = availability.endTime.split(":").map(Number);
    endTime.setHours(endHour, endMin, 0, 0);

    let currentSlot = new Date(startTime);

    while (currentSlot < endTime) {
      const slotEnd = new Date(currentSlot.getTime() + slotDuration * 60000);

      // Check if this slot conflicts with any existing booking
      const hasConflict = bookings.some((booking) => {
        return (
          (currentSlot >= booking.start && currentSlot < booking.end) ||
          (slotEnd > booking.start && slotEnd <= booking.end) ||
          (currentSlot <= booking.start && slotEnd >= booking.end)
        );
      });

      if (!hasConflict && slotEnd <= endTime) {
        slots.push({
          start: new Date(currentSlot),
          end: new Date(slotEnd),
        });
      }

      currentSlot = slotEnd;
    }

    return { success: true, slots, slotDuration };
  } catch (error) {
    console.error("Error getting doctor availability:", error);
    return { error: "Failed to get availability" };
  }
}
