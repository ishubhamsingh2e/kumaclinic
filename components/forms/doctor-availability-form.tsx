"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DoctorAvailability } from "@prisma/client";
import { updateDoctorAvailability } from "@/lib/actions/doctor";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle, INFO_STYLE } from "../ui/alert";
import { AlertTriangleIcon } from "lucide-react";

interface DoctorAvailabilityFormProps {
  clinicId: string;
  availability: DoctorAvailability[];
  slotDuration: number;
  allClinicsAvailability?: Array<{
    clinicId: string;
    clinicName: string;
    availability: DoctorAvailability[];
  }>;
  weeklyOffDays?: number[]; // Array of day numbers (0-6, Sunday-Saturday)
  onSaveSuccess?: () => void;
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

function formatTimeRange(startTime: string, slotDuration: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + slotDuration;

  const endHours = Math.floor(endMinutes / 60) % 24;
  const endMins = endMinutes % 60;

  const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

  return `${startTime}-${endTime}`;
}

function generateTimeSlots(
  slotDuration: number,
): Array<{ display: string; value: string }> {
  const slots: Array<{ display: string; value: string }> = [];
  const totalMinutesInDay = 24 * 60; // 1440 minutes

  // Generate slots from 00:00 continuously based on slot duration
  for (
    let totalMinutes = 0;
    totalMinutes < totalMinutesInDay;
    totalMinutes += slotDuration
  ) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const time24 = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    slots.push({
      value: time24,
      display: formatTimeRange(time24, slotDuration),
    });
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
  allClinicsAvailability = [],
  weeklyOffDays = [],
  onSaveSuccess,
}: DoctorAvailabilityFormProps) {
  const timeSlots = generateTimeSlots(slotDuration);

  // Build a map of conflicting slots from other clinics
  const conflictingSlots = new Map<string, string>(); // key: "dayIndex-timeSlot", value: clinic name

  allClinicsAvailability.forEach((clinic) => {
    if (clinic.clinicId === clinicId) return; // Skip current clinic

    clinic.availability.forEach((avail) => {
      timeSlots.forEach((slot) => {
        if (
          isSlotInRange(
            slot.value,
            avail.startTime,
            avail.endTime,
            slotDuration,
          )
        ) {
          const key = `${avail.dayOfWeek}-${slot.value}`;
          conflictingSlots.set(key, clinic.clinicName);
        }
      });
    });
  });

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

  // Store initial state to track changes
  const [initialSlots, setInitialSlots] = useState<Record<number, Set<string>>>(
    () => {
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
    },
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResetAlert, setShowResetAlert] = useState(false);

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

  // Check if a day has unsaved changes
  const hasDayChanged = (dayIndex: number): boolean => {
    const current = selectedSlots[dayIndex] || new Set();
    const initial = initialSlots[dayIndex] || new Set();

    if (current.size !== initial.size) return true;

    for (const slot of current) {
      if (!initial.has(slot)) return true;
    }

    return false;
  };

  const handleResetAll = () => {
    setShowResetAlert(true);
  };

  const confirmReset = () => {
    const emptySlots: Record<number, Set<string>> = {};
    for (let i = 0; i <= 6; i++) {
      emptySlots[i] = new Set();
    }
    setSelectedSlots(emptySlots);
    setShowResetAlert(false);
    toast.info("All slots cleared");
  };

  const handleSaveClick = () => {
    // Save directly - API will handle validation
    onSubmit();
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

      // Reset initial state to current selected state (removes change indicators)
      const newInitialSlots: Record<number, Set<string>> = {};
      for (let i = 0; i <= 6; i++) {
        newInitialSlots[i] = new Set(selectedSlots[i]);
      }
      setInitialSlots(newInitialSlots);

      // Refetch data to reflect changes across all clinics
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } else if (result.conflicts) {
      // Show detailed conflict error
      toast.error(result.message || "Failed to update availability.", {
        description: "Overlapping slots detected with other clinics",
        duration: 6000,
      });
    } else {
      toast.error(result.error || "Failed to update availability.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {conflictingSlots.size > 0 && (
        <Alert className={INFO_STYLE}>
          <AlertTriangleIcon className="h-4 w-4 text-destructive" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            Red slots are already scheduled in other clinics and cannot be
            selected. Hover over them to see which clinic.
          </AlertDescription>
        </Alert>
      )}

      <TooltipProvider>
        <Tabs defaultValue="0" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            {daysOfWeek.map((day, dayIndex) => {
              // Convert UI day index (Mon=0) to DB day index (Sun=0)
              const dbDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
              const hasChanges = hasDayChanged(dbDayIndex);
              const isOffDay = weeklyOffDays.includes(dbDayIndex);

              const tabTrigger = (
                <TabsTrigger
                  key={dayIndex}
                  value={dayIndex.toString()}
                  className="relative"
                  disabled={isOffDay}
                >
                  {day.slice(0, 3)}
                  {hasChanges && !isOffDay && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                  )}
                </TabsTrigger>
              );

              if (isOffDay) {
                return (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>{tabTrigger}</TooltipTrigger>
                    <TooltipContent>
                      <p>This is a weekly off day</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return tabTrigger;
            })}
          </TabsList>

          {daysOfWeek.map((day, dayIndex) => {
            // Convert UI day index (Mon=0) to DB day index (Sun=0)
            const dbDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
            const daySelectedSlots = selectedSlots[dbDayIndex] || new Set();

            return (
              <TabsContent key={dayIndex} value={dayIndex.toString()}>
                <Card className="p-4">
                  <h4 className="font-semibold mb-3 text-sm">{day}</h4>
                  <div className="grid grid-cols-8 gap-1 max-h-100 overflow-y-auto">
                    {timeSlots.map((slot) => {
                      const isSelected = daySelectedSlots.has(slot.value);
                      const conflictKey = `${dbDayIndex}-${slot.value}`;
                      const conflictClinic = conflictingSlots.get(conflictKey);
                      const hasConflict = !!conflictClinic;

                      const slotButton = (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => toggleSlot(dbDayIndex, slot.value)}
                          disabled={hasConflict}
                          className={cn(
                            "text-xs py-1.5 px-0.5 rounded transition-colors border",
                            hasConflict
                              ? "bg-destructive/20 text-destructive border-destructive cursor-not-allowed opacity-60"
                              : isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted border-border",
                          )}
                        >
                          {slot.display}
                        </button>
                      );

                      // Wrap conflicting slots with Tooltip
                      if (hasConflict) {
                        return (
                          <Tooltip key={slot.value}>
                            <TooltipTrigger asChild>
                              {slotButton}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Booked in{" "}
                                <span className="font-semibold">
                                  {conflictClinic}
                                </span>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return slotButton;
                    })}
                  </div>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </TooltipProvider>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleResetAll}
          disabled={isSubmitting}
          className="flex-1"
        >
          Reset All Slots
        </Button>
        <Button
          onClick={handleSaveClick}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Saving..." : "Save Availability"}
        </Button>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetAlert} onOpenChange={setShowResetAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Slots</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all selected time slots? This
              action will remove all your availability selections. You will need
              to save changes afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Reset All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
