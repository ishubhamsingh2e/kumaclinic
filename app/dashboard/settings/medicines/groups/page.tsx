import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MedicineGroups } from "@/components/settings/medicine-groups";

export default async function MedicineGroupsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  return <MedicineGroups />;
}
