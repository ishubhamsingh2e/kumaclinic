import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBooking } from "@/lib/actions/bookings";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import {
  sendAppointmentConfirmationEmail,
  sendDoctorAppointmentNotification,
  logWhatsAppMessage,
  logSMSMessage,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { patientId, clinicId, doctorId, start, end, reason, notes } = body;

    if (!patientId || !clinicId || !doctorId || !start || !end) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await createBooking({
      patientId,
      clinicId,
      doctorId,
      start: new Date(start),
      end: new Date(end),
      reason,
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Fetch related data for notifications
    const [patient, doctor, clinic] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
        select: { name: true, email: true, phone: true },
      }),
      prisma.user.findUnique({
        where: { id: doctorId },
        select: { name: true, email: true, title: true },
      }),
      prisma.clinic.findUnique({
        where: { id: clinicId },
        select: { name: true, address: true, city: true },
      }),
    ]);

    if (!patient || !doctor || !clinic) {
      return NextResponse.json(result.booking);
    }

    const appointmentDate = new Date(start);
    const appointmentTime = `${format(appointmentDate, "h:mm a")} - ${format(new Date(end), "h:mm a")}`;
    const clinicAddress =
      clinic.address && clinic.city
        ? `${clinic.address}, ${clinic.city}`
        : clinic.address || clinic.city || undefined;

    // Send notifications asynchronously (don't wait for them)
    Promise.all([
      // Create in-app notification for doctor
      prisma.notification.create({
        data: {
          userId: doctorId,
          title: "New Appointment Scheduled",
          message: `New appointment with ${patient.name} on ${format(appointmentDate, "MMM d, yyyy")} at ${format(appointmentDate, "h:mm a")}`,
          type: "APPOINTMENT",
          referenceId: result.booking.id,
          link: `/dashboard/appointments`,
        },
      }),

      // Send email to doctor
      doctor.email
        ? sendDoctorAppointmentNotification({
            to: doctor.email,
            patientName: patient.name,
            doctorName: doctor.name || "Doctor",
            doctorTitle: doctor.title || undefined,
            clinicName: clinic.name,
            appointmentDate,
            appointmentTime,
            reason: reason || undefined,
          }).catch((error) => {
            console.error("Failed to send doctor email:", error);
          })
        : Promise.resolve(),

      // Send email to patient if email exists
      patient.email
        ? sendAppointmentConfirmationEmail({
            to: patient.email,
            patientName: patient.name,
            doctorName: doctor.name || "Doctor",
            doctorTitle: doctor.title || undefined,
            clinicName: clinic.name,
            appointmentDate,
            appointmentTime,
            reason: reason || undefined,
            clinicAddress,
          }).catch((error) => {
            console.error("Failed to send patient email:", error);
          })
        : // If no email, log WhatsApp/SMS message
          Promise.resolve().then(() => {
            const message = `Hi ${patient.name}, your appointment with ${doctor.title || ""} ${doctor.name} at ${clinic.name} is confirmed for ${format(appointmentDate, "MMM d, yyyy")} at ${format(appointmentDate, "h:mm a")}. Please arrive 10 minutes early.`;
            logWhatsAppMessage(patient.phone, message);
            logSMSMessage(patient.phone, message);
          }),
    ]).catch((error) => {
      console.error("Error sending notifications:", error);
      // Don't fail the request if notifications fail
    });

    return NextResponse.json(result.booking);
  } catch (error: any) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create appointment" },
      { status: 500 }
    );
  }
}
