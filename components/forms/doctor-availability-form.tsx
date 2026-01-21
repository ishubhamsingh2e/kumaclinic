"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DoctorAvailability } from "@prisma/client";
import { updateDoctorAvailability } from "@/lib/actions/doctor";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DoctorAvailabilityFormProps {
  clinicId: string;
  availability: DoctorAvailability[];
  slotDuration: number;
}

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function generateTimeSlots(
  slotDuration: number,
): Array<{ display: string; value: string }> {
  const slots: Array<{ display: string; value: string }> = [];
  const startHour = 0;
  const endHour = 24;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push({
        value: time24,
        display: formatTo12Hour(time24),
      });
    }
  }

  return slots;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function isSlotInRange(
  slot: string,
  startTime: string,
  endTime: string,
  slotDuration: number,
): boolean {
  const slotMinutes = timeToMinutes(slot);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
}

export function DoctorAvailabilityForm({
  clinicId,
  availability,
  slotDuration,
}: DoctorAvailabilityFormProps) {
  const timeSlots = generateTimeSlots(slotDuration);

  // Initialize selected slots based on availability (stored as 24h format)
  const [selectedSlots, setSelectedSlots] = useState<
    Record<number, Set<string>>
  >(() => {
    const slots: Record<number, Set<string>> = {};
    for (let i = 0; i <= 6; i++) {
      slots[i] = new Set();
    }

    availability.forEach((avail) => {
      timeSlots.forEach((slot) => {
        if (
          isSlotInRange(
            slot.value,
            avail.startTime,
            avail.endTime,
            slotDuration,
          )
        ) {
          slots[avail.dayOfWeek].add(slot.value);
        }
      });
    });

    return slots;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSlot = (dayIndex: number, slotValue: string) => {
    setSelectedSlots((prev) => {
      const newSlots = { ...prev };
      const daySlots = new Set(prev[dayIndex]);

      if (daySlots.has(slotValue)) {
        daySlots.delete(slotValue);
      } else {
        daySlots.add(slotValue);
      }

      newSlots[dayIndex] = daySlots;
      return newSlots;
    });
  };

  const onSubmit = async () => {
    setIsSubmitting(true);

    // Convert selected slots to availability ranges
    const availabilityRanges: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }> = [];

    Object.entries(selectedSlots).forEach(([day, slots]) => {
      const dayIndex = parseInt(day);
      const sortedSlots = Array.from(slots).sort();

      if (sortedSlots.length === 0) return;

      let rangeStart = sortedSlots[0];
      let prevSlot = sortedSlots[0];

      for (let i = 1; i < sortedSlots.length; i++) {
        const currentSlot = sortedSlots[i];
        const prevMinutes = timeToMinutes(prevSlot);
        const currentMinutes = timeToMinutes(currentSlot);

        // If there's a gap, close the current range and start a new one
        if (currentMinutes - prevMinutes > slotDuration) {
          // Calculate end time (add slot duration to last slot)
          const endMinutes = prevMinutes + slotDuration;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

          availabilityRanges.push({
            dayOfWeek: dayIndex,
            startTime: rangeStart,
            endTime,
          });

          rangeStart = currentSlot;
        }

        prevSlot = currentSlot;
      }

      // Close the last range
      const endMinutes = timeToMinutes(prevSlot) + slotDuration;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

      availabilityRanges.push({
        dayOfWeek: dayIndex,
        startTime: rangeStart,
        endTime,
      });
    });

    const result = await updateDoctorAvailability({
      clinicId,
      availability: availabilityRanges,
    });

    if (result.success) {
      toast.success("Availability updated successfully.");
    } else {
      toast.error(result.error || "Failed to update availability.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {daysOfWeek.map((day, dayIndex) => {
          // Convert UI day index (Mon=0) to DB day index (Sun=0)
          const dbDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
          const daySelectedSlots = selectedSlots[dbDayIndex] || new Set();

          return (
            <Card key={dayIndex} className="p-4">
              <h4 className="font-semibold mb-3 text-sm">{day}</h4>
              <div className="grid grid-cols-10 gap-1 max-h-100 overflow-y-auto">
                {timeSlots.map((slot) => {
                  const isSelected = daySelectedSlots.has(slot.value);
                  return (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => toggleSlot(dbDayIndex, slot.value)}
                      className={cn(
                        "text-xs py-1.5 px-0.5 rounded transition-colors border",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border",
                      )}
                    >
                      {slot.display}
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Saving..." : "Save Availability"}
      </Button>
    </div>
  );
}
