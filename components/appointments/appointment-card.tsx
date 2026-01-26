import { Clock3, CheckCircle2, XCircle, CheckCheck, UserX } from "lucide-react";
import { Button } from "../ui/button";
import { format } from "date-fns";
import type { BookingStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  booking: {
    start: Date;
    end: Date;
    status: BookingStatus;
    Patient: {
      name: string;
    };
    Clinic: {
      name: string;
    };
  };
  onClick?: () => void;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    icon: Clock3,
    color: "bg-yellow-200",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "bg-blue-200",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCheck,
    color: "bg-green-200",
    borderColor: "border-green-200",
    textColor: "text-green-800",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-200",
    borderColor: "border-red-200",
    textColor: "text-red-800",
  },
  NO_SHOW: {
    label: "No Show",
    icon: UserX,
    color: "bg-gray-200",
    borderColor: "border-gray-200",
    textColor: "text-gray-800",
  },
};

export default function AppointmentCard({
  booking,
  onClick,
}: AppointmentCardProps) {
  const { status, start, end, Patient, Clinic } = booking;
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "rounded-xl border-4 overflow-clip cursor-pointer transition-all hover:drop-shadow-md",
        config.borderColor,
        config.color,
      )}
      onClick={onClick}
    >
      <div className="p-3 rounded-lg bg-background">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <span className="text-xs text-muted-foreground truncate block">
              {Clinic.name}
            </span>
            <h1 className="text-md font-semibold truncate">{Patient.name}</h1>
          </div>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">
            {format(new Date(start), "h:mm a")} -{" "}
            {format(new Date(end), "h:mm a")}
          </span>
        </div>
      </div>
      <div
        className={cn("flex justify-between items-center p-2", config.color)}
      >
        <div>
          <span
            className={cn("flex items-center gap-1 text-xs", config.textColor)}
          >
            <StatusIcon className="h-3 w-3" /> <span>{config.label}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
