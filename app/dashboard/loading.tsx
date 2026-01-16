import DashboardView from "@/components/dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <DashboardView title="Dashboard">
      <div className="space-y-2 mb-6">
        <Skeleton className="h-12 w-full" />
      </div>
      
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="aspect-video rounded-xl" />
        <Skeleton className="aspect-video rounded-xl" />
      </div>
      <Skeleton className="min-h-[50vh] mt-4 w-full rounded-xl" />
    </DashboardView>
  );
}
