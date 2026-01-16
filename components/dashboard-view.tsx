import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";
import { NotificationBell } from "@/components/notification-bell";

export interface DashboardViewProps {
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function DashboardView({
  title,
  children,
  actions,
}: DashboardViewProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <header className="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-lg">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {actions}
          </div>
        </div>
      </header>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">{children}</div>
    </div>
  );
}
