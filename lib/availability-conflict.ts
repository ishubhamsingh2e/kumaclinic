import { prisma } from "@/lib/db";

/**
 * Checks if time ranges overlap
 */
export function doTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  // Convert HH:MM to minutes for easier comparison
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = toMinutes(start1);
  const end1Min = toMinutes(end1);
  const start2Min = toMinutes(start2);
  const end2Min = toMinutes(end2);

  // Check if ranges overlap
  // A and B overlap if: (A.start < B.end) AND (B.start < A.end)
  return start1Min < end2Min && start2Min < end1Min;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    clinicId: string;
    clinicName: string;
  }>;
}

/**
 * Checks if proposed availability conflicts with existing availability in other clinics
 */
export async function checkAvailabilityConflicts(
  doctorId: string,
  currentClinicId: string,
  proposedAvailability: AvailabilitySlot[]
): Promise<ConflictResult> {
  // Get all availability for this doctor in OTHER clinics
  const existingAvailability = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
      clinicId: {
        not: currentClinicId,
      },
    },
    include: {
      Clinic: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const conflicts: ConflictResult["conflicts"] = [];

  // Check each proposed slot against existing availability
  for (const proposed of proposedAvailability) {
    for (const existing of existingAvailability) {
      // Only check same day of week
      if (proposed.dayOfWeek !== existing.dayOfWeek) {
        continue;
      }

      // Check if times overlap
      if (
        doTimesOverlap(
          proposed.startTime,
          proposed.endTime,
          existing.startTime,
          existing.endTime
        )
      ) {
        conflicts.push({
          dayOfWeek: existing.dayOfWeek,
          startTime: existing.startTime,
          endTime: existing.endTime,
          clinicId: existing.clinicId,
          clinicName: existing.Clinic.name,
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Gets all availability conflicts for a doctor across all clinics
 */
export async function getAllAvailabilityConflicts(doctorId: string) {
  const allAvailability = await prisma.doctorAvailability.findMany({
    where: {
      doctorId,
    },
    include: {
      Clinic: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const conflicts: Array<{
    clinic1: { id: string; name: string };
    clinic2: { id: string; name: string };
    dayOfWeek: number;
    overlappingTime: { start: string; end: string };
  }> = [];

  // Compare each availability slot with others
  for (let i = 0; i < allAvailability.length; i++) {
    for (let j = i + 1; j < allAvailability.length; j++) {
      const slot1 = allAvailability[i];
      const slot2 = allAvailability[j];

      // Skip if same clinic or different day
      if (
        slot1.clinicId === slot2.clinicId ||
        slot1.dayOfWeek !== slot2.dayOfWeek
      ) {
        continue;
      }

      // Check for overlap
      if (
        doTimesOverlap(
          slot1.startTime,
          slot1.endTime,
          slot2.startTime,
          slot2.endTime
        )
      ) {
        conflicts.push({
          clinic1: { id: slot1.clinicId, name: slot1.Clinic.name },
          clinic2: { id: slot2.clinicId, name: slot2.Clinic.name },
          dayOfWeek: slot1.dayOfWeek,
          overlappingTime: {
            start:
              slot1.startTime > slot2.startTime
                ? slot1.startTime
                : slot2.startTime,
            end: slot1.endTime < slot2.endTime ? slot1.endTime : slot2.endTime,
          },
        });
      }
    }
  }

  return conflicts;
}
