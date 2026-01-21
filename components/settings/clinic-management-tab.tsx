"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clinic, ClinicLocation, ClinicSettings } from "@prisma/client";
import { ClinicProfileForm } from "../forms/clinic-profile-form";
import { LocationManagement } from "../location-management";

interface ClinicManagementTabProps {
  clinic: Clinic & { ClinicLocation: ClinicLocation[] };
  settings: ClinicSettings | null;
}

export function ClinicManagementTab({
  clinic,
  settings,
}: ClinicManagementTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Clinic Profile</CardTitle>
          <CardDescription>
            Update your clinic&apos;s public profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClinicProfileForm clinic={clinic} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clinic Locations</CardTitle>
          <CardDescription>
            Manage your clinic&apos;s physical locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationManagement locations={clinic.ClinicLocation} />
        </CardContent>
      </Card>
    </div>
  );
}
