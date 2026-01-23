"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RiCalendarLine } from "@remixicon/react";
import { toast } from "sonner";

// Helper function to convert 24-hour time to 12-hour AM/PM format
function formatTimeTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Helper function to format time slot range
function formatTimeSlot(slot: string): string {
  const [start, end] = slot.split(" - ");
  return `${formatTimeTo12Hour(start)} - ${formatTimeTo12Hour(end)}`;
}

const AppointmentBookingSchema = z.object({
  clinicId: z.string().min(1, "Clinic is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  date: z.date(),
  timeSlot: z.string().min(1, "Time slot is required"),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentBookingData = z.infer<typeof AppointmentBookingSchema>;

interface AppointmentBookingFormProps {
  patient: {
    id: string;
    name: string;
    phone: string;
  };
}

export function AppointmentBookingForm({
  patient,
}: AppointmentBookingFormProps) {
  const router = useRouter();
  const [clinics, setClinics] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const form = useForm<AppointmentBookingData>({
    resolver: zodResolver(AppointmentBookingSchema),
    defaultValues: {
      clinicId: "",
      doctorId: "",
      reason: "",
      notes: "",
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    watch,
    setValue,
  } = form;
  const selectedClinic = watch("clinicId");
  const selectedDoctor = watch("doctorId");
  const selectedDate = watch("date");

  // Fetch clinics on mount
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await fetch("/api/clinics/user-clinics");
        const data = await response.json();
        setClinics(data.clinics || []);
      } catch (error) {
        console.error("Error fetching clinics:", error);
        toast.error("Failed to load clinics");
      } finally {
        setLoadingClinics(false);
      }
    };
    fetchClinics();
  }, []);

  // Fetch doctors when clinic is selected
  useEffect(() => {
    if (selectedClinic) {
      const fetchDoctors = async () => {
        setLoadingDoctors(true);
        try {
          const response = await fetch(
            `/api/clinics/${selectedClinic}/doctors`,
          );
          const data = await response.json();
          setDoctors(data.doctors || []);
        } catch (error) {
          console.error("Error fetching doctors:", error);
          toast.error("Failed to load doctors");
        } finally {
          setLoadingDoctors(false);
        }
      };
      fetchDoctors();
      setValue("doctorId", "");
      setValue("timeSlot", "");
      setTimeSlots([]);
    }
  }, [selectedClinic, setValue]);

  // Fetch available time slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      const fetchTimeSlots = async () => {
        setLoadingSlots(true);
        try {
          const response = await fetch(
            `/api/appointments/available-slots?doctorId=${selectedDoctor}&clinicId=${selectedClinic}&date=${selectedDate.toISOString()}`,
          );
          const data = await response.json();
          setTimeSlots(data.slots || []);
        } catch (error) {
          console.error("Error fetching time slots:", error);
          toast.error("Failed to load available time slots");
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchTimeSlots();
      setValue("timeSlot", "");
    }
  }, [selectedDoctor, selectedDate, selectedClinic, setValue]);

  const onSubmit = async (data: AppointmentBookingData) => {
    try {
      const [startTime, endTime] = data.timeSlot.split(" - ");
      const startDateTime = new Date(data.date);
      const endDateTime = new Date(data.date);

      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      startDateTime.setHours(startHour, startMinute, 0);
      endDateTime.setHours(endHour, endMinute, 0);

      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient.id,
          clinicId: data.clinicId,
          doctorId: data.doctorId,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          reason: data.reason,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to book appointment");
      }

      toast.success("Appointment booked successfully");
      router.push("/dashboard/appointments");
    } catch (error: any) {
      toast.error(
        error.message || "An error occurred while booking appointment",
      );
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Controller
            control={control}
            name="clinicId"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>
                  Clinic <span className="text-red-500">*</span>
                </FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loadingClinics}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingClinics ? "Loading..." : "Select clinic"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="doctorId"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>
                  Doctor <span className="text-red-500">*</span>
                </FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedClinic || loadingDoctors}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingDoctors ? "Loading..." : "Select doctor"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="date"
            render={({ field, fieldState: { error } }) => (
              <Field className="flex flex-col">
                <FieldLabel>
                  Date <span className="text-red-500">*</span>
                </FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <RiCalendarLine className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="timeSlot"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>
                  Time Slot <span className="text-red-500">*</span>
                </FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedDate || loadingSlots}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingSlots ? "Loading..." : "Select time slot"
                      }
                    >
                      {field.value ? formatTimeSlot(field.value) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.length > 0 ? (
                      timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {formatTimeSlot(slot)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_no_slots" disabled>
                        No available slots
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="reason"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Reason for Visit</FieldLabel>
                <Input {...field} placeholder="e.g., Regular checkup" />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field, fieldState: { error } }) => (
              <Field className="md:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <Textarea
                  {...field}
                  placeholder="Any additional information..."
                />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      <div className="mt-6 flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Booking..." : "Book Appointment"}
        </Button>
      </div>
    </form>
  );
}
