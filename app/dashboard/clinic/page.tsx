import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardView from "@/components/dashboard-view";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicProfileForm } from "@/components/forms/clinic-profile-form";
import { LocationManagement } from "@/components/clinic/location-management";
import { QRCodeGenerator } from "@/components/clinic/qr-code-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function ClinicManagementPage() {
  const session = await auth();
  const activeClinicId = session?.user?.activeClinicId;

  if (!activeClinicId) {
    redirect("/dashboard");
  }

  const isManager = session.user.role === "CLINIC_MANAGER" || session.user.role === "SUPER_ADMIN";
  if (!isManager) {
    redirect("/dashboard");
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: activeClinicId },
    include: {
      locations: true,
    },
  });

  if (!clinic) {
    redirect("/dashboard");
  }

  const publicUrl = `/c/${clinic.slug || clinic.id}`;

  return (
    <DashboardView 
      title="Clinic Management"
      actions={
        <Button variant="outline" size="sm" asChild>
          <Link href={publicUrl} target="_blank">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Public Page
          </Link>
        </Button>
      }
    >
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile & Branding</TabsTrigger>
          <TabsTrigger value="locations">Locations & Hours</TabsTrigger>
          <TabsTrigger value="share">QR & Sharing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ClinicProfileForm clinic={clinic} />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <LocationManagement locations={clinic.locations} />
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Public Page Link</CardTitle>
                <CardDescription>
                  Share this link with your patients or on social media.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {process.env.NEXTAUTH_URL}/c/{clinic.slug || clinic.id}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Note: Your page must be set to "Published" in the Profile tab to be visible to the public.
                </p>
              </CardContent>
            </Card>
            <QRCodeGenerator url={`${process.env.NEXTAUTH_URL}/c/${clinic.slug || clinic.id}`} clinicName={clinic.name} />
          </div>
        </TabsContent>
      </Tabs>
    </DashboardView>
  );
}
