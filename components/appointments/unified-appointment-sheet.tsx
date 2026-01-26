"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { BookingStatus } from "@prisma/client";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";

import { updateBookingStatus } from "@/lib/actions/bookings";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ----------------------------- Types ----------------------------- */

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

interface UnifiedAppointmentSheetProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: () => void;
}

/* ----------------------------- Helpers ----------------------------- */

const getPatientAge = (dob: Date) =>
  new Date().getFullYear() - new Date(dob).getFullYear();

const formatTimeRange = (start: Date, end: Date) =>
  `${format(new Date(start), "h:mm a")} - ${format(new Date(end), "h:mm a")}`;

/* ----------------------------- Component ----------------------------- */

export function UnifiedAppointmentSheet({
  booking,
  open,
  onOpenChange,
  onStatusUpdate,
}: UnifiedAppointmentSheetProps) {
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    status: booking.status,
    reason: booking.reason || "",
    notes: booking.notes || "",
  });

  /* Sync form with booking */
  useEffect(() => {
    setEditData({
      status: booking.status,
      reason: booking.reason || "",
      notes: booking.notes || "",
    });
  }, [booking]);

  const patientAge = getPatientAge(booking.Patient.dob);

  /* ----------------------------- Actions ----------------------------- */

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    try {
      setLoading(true);
      const result = await updateBookingStatus(booking.id, newStatus);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Appointment ${newStatus.toLowerCase()}`);
      onStatusUpdate?.();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);

      if (editData.status !== booking.status) {
        const result = await updateBookingStatus(booking.id, editData.status);

        if (result.error) {
          toast.error(result.error);
          return;
        }
      }

      toast.success("Changes saved successfully");
      onStatusUpdate?.();
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- Render ----------------------------- */

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:min-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Appointment Management</SheetTitle>
          <SheetDescription>View and manage this appointment</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          <Card className="p-4 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Details</h3>

              <Select
                value={editData.status}
                onValueChange={(value) =>
                  setEditData({
                    ...editData,
                    status: value as BookingStatus,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(BookingStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Info label="Patient" value={booking.Patient.name} />
              <Info
                label="Date & Time"
                value={`${format(
                  new Date(booking.start),
                  "MMM d",
                )}, ${formatTimeRange(booking.start, booking.end)}`}
              />
              <Info
                label="Doctor"
                value={`${booking.User?.title || ""} ${
                  booking.User?.name || "Not assigned"
                }`}
              />
              <Info label="Clinic" value={booking.Clinic.name} />
              <Info
                label="Age / Gender"
                value={`${patientAge} years / ${booking.Patient.gender}`}
              />
              <Info label="Phone" value={booking.Patient.phone} />
              {booking.Patient.email && (
                <Info label="Email" value={booking.Patient.email} />
              )}
              <Info
                label="DOB"
                value={format(new Date(booking.Patient.dob), "MMMM d, yyyy")}
              />
            </div>

            {/* Reason & Notes Display */}
            {(booking.reason || booking.notes) && (
              <>
                <Separator />
                <div className="space-y-3">
                  {booking.reason && (
                    <Section title="Reason for Visit">{booking.reason}</Section>
                  )}
                  {booking.notes && (
                    <Section title="Additional Notes">{booking.notes}</Section>
                  )}
                </div>
              </>
            )}

            {/* Editable Fields */}
            <FormTextarea
              label="Reason for Visit"
              value={editData.reason}
              onChange={(val) => setEditData({ ...editData, reason: val })}
            />

            <FormTextarea
              label="Additional Notes"
              value={editData.notes}
              onChange={(val) => setEditData({ ...editData, notes: val })}
            />
          </Card>
        </div>

        <SheetFooter>
          <div className="flex gap-2">
            {booking.status === "PENDING" && (
              <ActionGroup
                actions={[
                  {
                    label: "Confirm",
                    onClick: () => handleStatusUpdate("CONFIRMED"),
                  },
                  {
                    label: "Cancel",
                    onClick: () => handleStatusUpdate("CANCELLED"),
                    variant: "destructive",
                  },
                ]}
                loading={loading}
              />
            )}

            {booking.status === "CONFIRMED" && (
              <ActionGroup
                actions={[
                  {
                    label: "Completed",
                    onClick: () => handleStatusUpdate("COMPLETED"),
                  },
                  {
                    label: "No Show",
                    onClick: () => handleStatusUpdate("NO_SHOW"),
                    variant: "outline",
                  },
                ]}
                loading={loading}
              />
            )}
            <Button
              onClick={handleSaveEdit}
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ----------------------------- Small Components ----------------------------- */

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <h3 className="font-semibold flex items-center gap-2 mb-1">
        <FileText className="h-4 w-4" />
        {title}
      </h3>
      <div className="bg-muted/30 rounded-lg p-2">
        <p className="text-sm">{children}</p>
      </div>
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </div>
  );
}

function ActionGroup({
  actions,
  loading,
}: {
  actions: {
    label: string;
    onClick: () => void;
    variant?: "outline" | "destructive";
  }[];
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          onClick={action.onClick}
          disabled={loading}
          variant={action.variant}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
