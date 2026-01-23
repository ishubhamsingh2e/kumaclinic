"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookingStatus } from "@prisma/client";
import { updateBookingStatus } from "@/lib/actions/bookings";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";

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

interface AppointmentDetailsDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: () => void;
}

export function AppointmentDetailsDialog({
  booking,
  open,
  onOpenChange,
  onStatusUpdate,
}: AppointmentDetailsDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    setLoading(true);
    const result = await updateBookingStatus(booking.id, newStatus);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Appointment ${newStatus.toLowerCase()}`);
      onStatusUpdate?.();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const getStatusBadgeVariant = (status: BookingStatus) => {
    switch (status) {
      case "PENDING":
        return "outline" as const;
      case "CONFIRMED":
        return "default" as const;
      case "COMPLETED":
        return "secondary" as const;
      case "CANCELLED":
        return "destructive" as const;
      case "NO_SHOW":
        return "secondary" as const;
      default:
        return "default" as const;
    }
  };

  const patientAge =
    new Date().getFullYear() - new Date(booking.Patient.dob).getFullYear();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:min-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">Appointment Details</SheetTitle>
          <SheetDescription>
            View and manage appointment information
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={getStatusBadgeVariant(booking.status)}>
              {booking.status}
            </Badge>
          </div>

          <Separator />

          {/* Appointment Time */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointment Time
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">
                  {format(new Date(booking.start), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Time:</span>
                <p className="font-medium">
                  {format(new Date(booking.start), "h:mm a")} -{" "}
                  {format(new Date(booking.end), "h:mm a")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Patient Information */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">{booking.Patient.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Age / Gender:</span>
                <p className="font-medium">
                  {patientAge} years / {booking.Patient.gender}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone:
                </span>
                <p className="font-medium">{booking.Patient.phone}</p>
              </div>
              {booking.Patient.email && (
                <div>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email:
                  </span>
                  <p className="font-medium">{booking.Patient.email}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Doctor & Clinic */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Clinic & Doctor
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Clinic:</span>
                <p className="font-medium">{booking.Clinic.name}</p>
                {booking.Clinic.address && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {booking.Clinic.address}
                    {booking.Clinic.city ? `, ${booking.Clinic.city}` : ""}
                  </p>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Doctor:</span>
                <p className="font-medium">
                  {booking.User?.title} {booking.User?.name || "Not assigned"}
                </p>
              </div>
            </div>
          </div>

          {/* Reason & Notes */}
          {(booking.reason || booking.notes) && (
            <>
              <Separator />
              <div className="space-y-3">
                {booking.reason && (
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      Reason for Visit
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {booking.reason}
                    </p>
                  </div>
                )}
                {booking.notes && (
                  <div>
                    <h3 className="font-semibold text-sm mb-1">
                      Additional Notes
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {booking.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          {booking.status === "PENDING" && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStatusUpdate("CONFIRMED")}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("CANCELLED")}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          {booking.status === "CONFIRMED" && (
            <>
              <Separator />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStatusUpdate("COMPLETED")}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Mark Completed
                </Button>
                <Button
                  onClick={() => handleStatusUpdate("NO_SHOW")}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  No Show
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
