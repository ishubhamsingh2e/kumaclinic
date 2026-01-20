"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { updateClinicSettings } from "@/lib/actions/clinicSettings";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Clinic, ClinicLocation, ClinicSettings } from "@prisma/client";
import { Field, FieldContent, FieldError, FieldLabel } from "../ui/field";
import { ClinicProfileForm } from "../forms/clinic-profile-form";
import { LocationManagement } from "../location-management";

interface ClinicManagementTabProps {
  clinic: Clinic & { ClinicLocation: ClinicLocation[] };
  settings: ClinicSettings | null;
}

const timeSlotSettingsSchema = z.object({
  slotDurationInMin: z.number().int().positive("Must be a positive number"),
});

type TimeSlotSettingsFormValues = z.infer<typeof timeSlotSettingsSchema>;

export function ClinicManagementTab({
  clinic,
  settings,
}: ClinicManagementTabProps) {
  const form = useForm<TimeSlotSettingsFormValues>({
    resolver: zodResolver(timeSlotSettingsSchema),
    defaultValues: {
      slotDurationInMin: settings?.slotDurationInMin || 30,
    },
  });

  const {
    formState: { isSubmitting, errors },
  } = form;

  const onSubmit = async (values: TimeSlotSettingsFormValues) => {
    try {
      const result = await updateClinicSettings(
        {
          type: "",
          message: "",
          errors: {},
        },
        {
          ...values,
          clinicId: clinic.id,
        },
      );
      if (result.type === "success") {
        toast.success(result.message);
      } else {
        toast.error(result.message, {
          description: result.errors
            ? Object.values(result.errors).flat().join("\n")
            : undefined,
        });
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  return (
    <div className="space-y-8">
      <ClinicProfileForm clinic={clinic} />
      <Separator />
      <LocationManagement locations={clinic.ClinicLocation} />
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Time Slot Settings</CardTitle>
          <CardDescription>
            Define the duration of appointment time slots for your clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Field>
                <FieldLabel>Slot Duration (in minutes)</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    {...form.register("slotDurationInMin")}
                  />
                </FieldContent>
                {errors.slotDurationInMin && (
                  <FieldError>{errors.slotDurationInMin.message}</FieldError>
                )}
              </Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          ) : (
            <div>Loading...</div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Doctor Availability</CardTitle>
          <CardDescription>
            Manage the working hours for doctors in your clinic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO: Implement Doctor Availability Management */}
          <p>Doctor availability management will be here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
