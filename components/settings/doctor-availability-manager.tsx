"use client";

import { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { Clinic, DoctorAvailability } from "@prisma/client";
import { DoctorAvailabilityForm } from "../forms/doctor-availability-form";
import { getDoctorClinics } from "@/lib/actions/doctor";

type ClinicWithAvailability = Clinic & {
  DoctorAvailability: DoctorAvailability[];
};

export function DoctorAvailabilityManager() {
  const [clinics, setClinics] = useState<ClinicWithAvailability[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClinics() {
      const result = await getDoctorClinics();
      if (result.error) {
        setError(result.error);
      } else if (result.clinics) {
        setClinics(result.clinics);
      }
    }
    fetchClinics();
  }, []);

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (clinics.length === 0) {
    return <p>You are not a member of any clinics.</p>;
  }

  return (
    <div className="space-y-4">
      {clinics.map((clinic) => (
        <Collapsible key={clinic.id} className="space-y-2">
          <div className="flex items-center justify-between space-x-4 px-4">
            <h4 className="text-sm font-semibold">{clinic.name}</h4>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 p-0">
                <ChevronsUpDown className="h-4 w-4" />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-2 p-4">
            <DoctorAvailabilityForm
              clinicId={clinic.id}
              availability={clinic.DoctorAvailability}
            />
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
