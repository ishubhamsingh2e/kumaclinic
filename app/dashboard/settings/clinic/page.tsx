import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ClinicManagementTab } from "@/components/settings/clinic-management-tab";
import { getClinicSettings } from "@/lib/actions/clinicSettings";

export default async function ClinicManagementPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  const activeClinicId = session.user.activeClinicId;

  if (!activeClinicId) {
    redirect("/dashboard/settings");
  }

  const isManager =
    session.user.role === "CLINIC_MANAGER" || session.user.role === "ADMIN";

  if (!isManager) {
    redirect("/dashboard/settings");
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: activeClinicId },
  });

  if (!clinic) {
    redirect("/dashboard/settings");
  }

  // Fetch all user's clinics for the clinics list
  const allUserClinics = await prisma.clinic.findMany({
    where: {
      ClinicMember: {
        some: {
          userId: session.user.id,
        },
      },
    },
    include: {
      ClinicMember: {
        where: {
          userId: session.user.id,
        },
        include: {
          Role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const { settings: clinicSettings } = await getClinicSettings({
    clinicId: activeClinicId,
  });

  return (
    <ClinicManagementTab
      clinic={clinic}
      settings={clinicSettings ?? null}
      allClinics={allUserClinics}
    />
  );
}
