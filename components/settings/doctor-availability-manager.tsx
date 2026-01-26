"use client";

import { useCallback, useEffect, useState } from "react";
import { Clinic, DoctorAvailability } from "@prisma/client";
import { DoctorAvailabilityForm } from "../forms/doctor-availability-form";
import { getDoctorClinics } from "@/lib/actions/doctor";
import { getWeeklyOffDays } from "@/lib/actions/off-days";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyOffDaysSelector } from "../off-days/weekly-off-days-selector";
import { SpecificOffDaysManager } from "../off-days/specific-off-days-manager";

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
  const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchClinics = useCallback(async () => {
    setIsLoading(true);
    const result = await getDoctorClinics();
    if (result.error) {
      setError(result.error);
    } else if (result.clinics) {
      setClinics(result.clinics);
      if (result.clinics.length > 0 && !selectedClinicId) {
        setSelectedClinicId(result.clinics[0].id);
      }
    }
    setIsLoading(false);
  }, [selectedClinicId]);

  const fetchWeeklyOffDays = useCallback(async (clinicId: string) => {
    const result = await getWeeklyOffDays(clinicId);
    if (result.error) {
      console.error("Error fetching weekly off days:", result.error);
      setWeeklyOffDays([]);
    } else {
      setWeeklyOffDays(result.offDays || []);
    }
  }, []);

  useEffect(() => {
    fetchClinics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClinicId) {
      fetchWeeklyOffDays(selectedClinicId);
    }
  }, [selectedClinicId, fetchWeeklyOffDays]);

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (isLoading && clinics.length === 0) {
    return <p>Loading clinics...</p>;
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
        <Tabs defaultValue="availability" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="weekly-off">Weekly Off Days</TabsTrigger>
            <TabsTrigger value="specific-off">Specific Off Days</TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="space-y-4">
            <DoctorAvailabilityForm
              key={selectedClinic.id}
              clinicId={selectedClinic.id}
              availability={selectedClinic.DoctorAvailability}
              slotDuration={slotDuration}
              allClinicsAvailability={clinics.map((c) => ({
                clinicId: c.id,
                clinicName: c.name,
                availability: c.DoctorAvailability,
              }))}
              weeklyOffDays={weeklyOffDays}
              onSaveSuccess={fetchClinics}
            />
          </TabsContent>

          <TabsContent value="weekly-off" className="space-y-4">
            <WeeklyOffDaysSelector
              clinicId={selectedClinic.id}
              onUpdate={() => fetchWeeklyOffDays(selectedClinic.id)}
            />
          </TabsContent>

          <TabsContent value="specific-off" className="space-y-4">
            <SpecificOffDaysManager clinicId={selectedClinic.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
