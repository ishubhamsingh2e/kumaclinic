import { ClientSidebar } from "@/components/sidebar/client-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ClientSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
