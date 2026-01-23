import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardView from "@/components/dashboard-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { AppointmentBookingForm } from "@/components/appointments/appointment-booking-form";

export default async function NewAppointmentPage({
  params,
}: {
  params: Promise<{ patient_id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { patient_id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id: patient_id },
  });

  if (!patient) {
    redirect("/dashboard/patients");
  }

  return (
    <DashboardView title="Book Appointment">
      <Card>
        <CardHeader>
          <CardTitle>Book Appointment</CardTitle>
          <CardDescription>
            Booking appointment for {patient.name} ({patient.phone})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentBookingForm patient={patient} />
        </CardContent>
      </Card>
    </DashboardView>
  );
}
