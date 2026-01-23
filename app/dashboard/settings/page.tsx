import { UserProfileForm } from "@/components/forms/user-profile-form";
import { UserPasswordForm } from "@/components/forms/user-password-form";
import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { NotificationSettings } from "@/components/settings/notification-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DoctorAvailabilityManager } from "@/components/settings/doctor-availability-manager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user profile
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      title: true,
      phone: true,
      dob: true,
      address: true,
      licenseNumber: true,
      slotDurationInMin: true,
    },
  });

  if (!dbUser) {
    redirect("/login");
  }

  // Combine session user with dbUser
  const user = {
    ...dbUser,
    activeClinicId: session.user.activeClinicId,
    role: session.user.role,
    permissions: session.user.permissions,
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Main Profile Column */}
      <div className="space-y-6 md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This is how others will see you on the site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserProfileForm user={user} />
          </CardContent>
        </Card>
        
        {user.title === "Dr." && (
          <Card>
            <CardHeader>
              <CardTitle>Doctor Availability</CardTitle>
              <CardDescription>
                Set your availability for each clinic you are a member of.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DoctorAvailabilityManager
                slotDuration={user.slotDurationInMin || 30}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Side Column */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Update your account password.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserPasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectedAccounts />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
