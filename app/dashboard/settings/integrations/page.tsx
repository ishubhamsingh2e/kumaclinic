import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IntegrationsTab } from "@/components/settings/integrations-tab";

export default async function IntegrationsPage() {
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

  return <IntegrationsTab />;
}
