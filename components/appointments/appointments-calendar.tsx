"use client";

import { useState } from "react";
import { EventCalendar } from "@/components/event-calendar/event-calendar";
import { CalendarEvent, EventColor } from "@/components/event-calendar/types";
import { BookingStatus } from "@prisma/client";
import { AppointmentDetailsDialog } from "./appointment-details-dialog";

interface Booking {
  id: string;
  start: Date;
  end: Date;
  title: string;
  status: BookingStatus;
  reason: string | null;
  notes: string | null;
  Patient: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    gender: string;
    dob: Date;
  };
  User: {
    id: string;
    name: string | null;
    email: string | null;
    title: string | null;
  } | null;
  Clinic: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  };
}

interface AppointmentsCalendarProps {
  bookings: Booking[];
  currentUserId: string;
  activeClinicId: string;
}

function getStatusColor(status: BookingStatus): EventColor {
  switch (status) {
    case "PENDING":
      return "amber";
    case "CONFIRMED":
      return "sky";
    case "COMPLETED":
      return "emerald";
    case "CANCELLED":
      return "rose";
    case "NO_SHOW":
      return "violet";
    default:
      return "sky";
  }
}

export function AppointmentsCalendar({
  bookings,
  currentUserId,
  activeClinicId,
}: AppointmentsCalendarProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const events: CalendarEvent[] = bookings.map((booking) => ({
    id: booking.id,
    title: booking.title,
    description: booking.reason || undefined,
    start: new Date(booking.start),
    end: new Date(booking.end),
    color: getStatusColor(booking.status),
    location: booking.Clinic.name,
  }));

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedBookingId(event.id);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-muted-foreground">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-sky-500" />
          <span className="text-muted-foreground">Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-rose-500" />
          <span className="text-muted-foreground">Cancelled</span>
        </div>
      </div>

      <EventCalendar
        events={events}
        initialView="month"
        onEventUpdate={handleEventClick}
      />

      {selectedBooking && (
        <AppointmentDetailsDialog
          booking={selectedBooking}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onStatusUpdate={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
