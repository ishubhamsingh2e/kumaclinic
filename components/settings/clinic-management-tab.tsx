"use client";

import { Clinic, ClinicSettings } from "@prisma/client";
import { ClinicProfileFormCombined } from "../forms/clinic-profile-form-combined";
import { SocialMediaLinksForm } from "../forms/social-media-links-form";
import { OwnerPrivacyForm } from "../forms/owner-privacy-form";
import { ClinicsList } from "../clinic/clinics-list";
import { Separator } from "@/components/ui/separator";

interface ClinicWithRole extends Clinic {
  ClinicMember: Array<{
    Role: {
      name: string;
    };
  }>;
}

interface ClinicManagementTabProps {
  clinic: Clinic;
  settings: ClinicSettings | null;
  allClinics: ClinicWithRole[];
}

export function ClinicManagementTab({
  clinic,
  settings,
  allClinics,
}: ClinicManagementTabProps) {
  return (
    <div className="space-y-8">
      {/* All Clinics List */}
      <ClinicsList clinics={allClinics} />

      <Separator />

      {/* Current Clinic Management */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Current Clinic Details</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Content Column - Left Side (2/3 width) */}
          <div className="space-y-6 md:col-span-2">
            <ClinicProfileFormCombined clinic={clinic} />
          </div>

          {/* Sidebar Column - Right Side (1/3 width) */}
          <div className="space-y-6">
            <SocialMediaLinksForm clinic={clinic} />

            <OwnerPrivacyForm clinic={clinic} />
          </div>
        </div>
      </div>
    </div>
  );
}
