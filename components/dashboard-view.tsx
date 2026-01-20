import { NotificationBell } from "./notification-bell";
import { Separator } from "./ui/separator";
import { SidebarTrigger } from "./ui/sidebar";

export interface DashboardViewProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function DashboardView({
  title,
  subtitle,
  children,
  actions,
}: DashboardViewProps) {
  return (
    <div className="flex h-full w-full flex-col">
      <header className="bg-background flex h-16 shrink-0 items-center gap-2 rounded-t-2xl border-b px-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4 my-auto" />
            <div className="flex flex-col gap-0 leading-tight">
              <h1 className="text-md font-semibold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
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
