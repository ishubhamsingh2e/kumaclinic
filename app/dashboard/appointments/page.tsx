import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppointmentsAgenda } from "@/components/appointments/appointments-agenda";
import DashboardView from "@/components/dashboard-view";
import { prisma } from "@/lib/db";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const activeClinicId = session.user.activeClinicId;

  if (!activeClinicId) {
    return (
      <DashboardView title="Appointments">
        <div className="flex flex-col items-center justify-center h-100 text-center">
          <p className="text-muted-foreground">
            Please select a clinic to view appointments.
          </p>
        </div>
      </DashboardView>
    );
  }

  // Fetch all bookings for the current user across all clinics
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { doctorId: session.user.id }, // Bookings where user is the doctor
        {
          Clinic: {
            ClinicMember: {
              some: {
                userId: session.user.id, // Bookings at clinics where user is a member
              },
            },
          },
        },
      ],
    },
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

  return (
    <DashboardView title="Appointments">
      <AppointmentsAgenda
        initialBookings={bookings}
        currentUserId={session.user.id}
        activeClinicId={activeClinicId}
      />
    </DashboardView>
  );
}
