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
  Stethoscope,
  Building2,
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

interface AppointmentDetailsSheetProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate?: () => void;
}

export function AppointmentDetailsSheet({
  booking,
  open,
  onOpenChange,
  onStatusUpdate,
}: AppointmentDetailsSheetProps) {
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
      <SheetHeader>
        <SheetTitle className="flex items-center justify-between">
          <span>Appointment Details</span>
          <Badge variant={getStatusBadgeVariant(booking.status)}>
            {booking.status}
          </Badge>
        </SheetTitle>
        <SheetDescription>Complete appointment information</SheetDescription>
      </SheetHeader>

      <SheetContent className="w-full sm:min-w-2xl overflow-y-auto">
        <div className="space-y-6 p-4">
          {/* Appointment Time */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              Appointment Time
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Date:</span>
                <p className="font-medium">
                  {format(new Date(booking.start), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Time:</span>
                <p className="font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(booking.start), "h:mm a")} -{" "}
                  {format(new Date(booking.end), "h:mm a")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Patient Information */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <User className="h-4 w-4" />
              Patient Information
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Name:
                  </span>
                  <p className="font-medium">{booking.Patient.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">
                    Age / Gender:
                  </span>
                  <p className="font-medium">
                    {patientAge} years / {booking.Patient.gender}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground flex items-center gap-1 mb-1">
                    <Phone className="h-3 w-3" /> Phone:
                  </span>
                  <p className="font-medium">{booking.Patient.phone}</p>
                </div>
                {booking.Patient.email && (
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Mail className="h-3 w-3" /> Email:
                    </span>
                    <p className="font-medium text-xs break-all">
                      {booking.Patient.email}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">
                  Date of Birth:
                </span>
                <p className="font-medium text-sm">
                  {format(new Date(booking.Patient.dob), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Doctor Information */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Stethoscope className="h-4 w-4" />
              Doctor
            </h3>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-medium">
                {booking.User?.title} {booking.User?.name || "Not assigned"}
              </p>
              {booking.User?.email && (
                <p className="text-sm text-muted-foreground mt-1">
                  {booking.User.email}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Clinic Information */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Building2 className="h-4 w-4" />
              Clinic
            </h3>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-medium">{booking.Clinic.name}</p>
              {booking.Clinic.address && (
                <div className="flex items-start gap-1.5 mt-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    {booking.Clinic.address}
                    {booking.Clinic.city ? `, ${booking.Clinic.city}` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reason & Notes */}
          {(booking.reason || booking.notes) && (
            <>
              <Separator />
              <div className="space-y-4">
                {booking.reason && (
                  <div>
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4" />
                      Reason for Visit
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm">{booking.reason}</p>
                    </div>
                  </div>
                )}
                {booking.notes && (
                  <div>
                    <h3 className="font-semibold text-sm mb-2">
                      Additional Notes
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        {booking.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          {booking.status === "PENDING" && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleStatusUpdate("CONFIRMED")}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("CANCELLED")}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}

          {booking.status === "CONFIRMED" && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleStatusUpdate("COMPLETED")}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Mark Completed
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate("NO_SHOW")}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    No Show
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
