"use client";

import { useEffect, useState } from "react";
import { Clinic, DoctorAvailability } from "@prisma/client";
import { DoctorAvailabilityForm } from "../forms/doctor-availability-form";
import { getDoctorClinics } from "@/lib/actions/doctor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type ClinicWithAvailability = Clinic & {
  DoctorAvailability: DoctorAvailability[];
};

interface DoctorAvailabilityManagerProps {
  slotDuration?: number;
}

export function DoctorAvailabilityManager({
  slotDuration = 30,
}: DoctorAvailabilityManagerProps) {
  const [clinics, setClinics] = useState<ClinicWithAvailability[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClinics() {
      const result = await getDoctorClinics();
      if (result.error) {
        setError(result.error);
      } else if (result.clinics) {
        setClinics(result.clinics);
        if (result.clinics.length > 0) {
          setSelectedClinicId(result.clinics[0].id);
        }
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

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label htmlFor="clinic-select" className="min-w-25">
          Select Clinic:
        </Label>
        <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
          <SelectTrigger id="clinic-select" className="w-full max-w-md">
            <SelectValue placeholder="Select a clinic" />
          </SelectTrigger>
          <SelectContent>
            {clinics.map((clinic) => (
              <SelectItem key={clinic.id} value={clinic.id}>
                {clinic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClinic && (
        <DoctorAvailabilityForm
          clinicId={selectedClinic.id}
          availability={selectedClinic.DoctorAvailability}
          slotDuration={slotDuration}
        />
      )}
    </div>
  );
}
