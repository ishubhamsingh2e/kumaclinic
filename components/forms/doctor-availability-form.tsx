"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DoctorAvailability } from "@prisma/client";
import { updateDoctorAvailability } from "@/lib/actions/doctor";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

const formSchema = z.object({
  availability: z.array(availabilitySchema),
});

type FormValues = z.infer<typeof formSchema>;

interface DoctorAvailabilityFormProps {
  clinicId: string;
  availability: DoctorAvailability[];
}

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function DoctorAvailabilityForm({
  clinicId,
  availability,
}: DoctorAvailabilityFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      availability: availability.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "availability",
  });

  const {
    formState: { isSubmitting, errors },
  } = form;

  const onSubmit = async (values: FormValues) => {
    const result = await updateDoctorAvailability({
      clinicId,
      availability: values.availability,
    });
    if (result.success) {
      toast.success("Availability updated successfully.");
    } else {
      toast.error(result.error || "Failed to update availability.");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        {daysOfWeek.map((day, dayIndex) => (
          <Card key={dayIndex} className="p-4">
            <h4 className="font-semibold mb-2">{day}</h4>
            <div className="space-y-2">
              {fields
                .filter((field) => field.dayOfWeek === dayIndex)
                .map((field, index) => {
                  // find correct index in the fields array
                  const realIndex = fields.findIndex((f) => f.id === field.id);
                  return (
                    <div key={field.id} className="flex items-end gap-2">
                      <Field>
                        <FieldLabel>Start Time</FieldLabel>
                        <FieldContent>
                          <Input
                            type="time"
                            {...form.register(
                              `availability.${realIndex}.startTime`,
                            )}
                          />
                        </FieldContent>
                        {errors.availability?.[realIndex]?.startTime && (
                          <FieldError>
                            {errors.availability[realIndex]?.startTime?.message}
                          </FieldError>
                        )}
                      </Field>
                      <Field>
                        <FieldLabel>End Time</FieldLabel>
                        <FieldContent>
                          <Input
                            type="time"
                            {...form.register(
                              `availability.${realIndex}.endTime`,
                            )}
                          />
                        </FieldContent>
                        {errors.availability?.[realIndex]?.endTime && (
                          <FieldError>
                            {errors.availability[realIndex]?.endTime?.message}
                          </FieldError>
                        )}
                      </Field>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(realIndex)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                append({
                  dayOfWeek: dayIndex,
                  startTime: "09:00",
                  endTime: "17:00",
                })
              }
            >
              Add Time Slot
            </Button>
          </Card>
        ))}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save All Availabilities"}
      </Button>
    </form>
  );
}
