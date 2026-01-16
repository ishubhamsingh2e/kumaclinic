import { getMyInvitations } from "@/lib/actions/clinic";
import { InvitationBanner } from "@/components/invitation-banner";
import DashboardView from "@/components/dashboard-view";

export default async function Dashboard() {
  const invitations = await getMyInvitations();

  return (
    <DashboardView title="Dashboard">
      <InvitationBanner invitations={invitations} />
      
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
        <div className="bg-muted/50 aspect-video rounded-xl" />
      </div>
      <div className="bg-muted/50 min-h-screen mt-4 flex-1 rounded-xl md:min-h-min" />
    </DashboardView>
  );
}
