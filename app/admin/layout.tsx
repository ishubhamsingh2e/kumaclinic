import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ClientSidebar } from "@/components/sidebar/client-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is logged in
  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has ADMIN or ADMIN role
  const userRole = session.user.role;
  if (userRole !== "ADMIN" && userRole !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <SidebarProvider>
      <ClientSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
