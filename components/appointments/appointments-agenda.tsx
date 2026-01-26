"use client";

import { useState, useMemo, useEffect } from "react";
import {
  format,
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isPast,
  isFuture,
  isSameDay,
} from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Clock3,
  CheckCheck,
  UserX,
  Filter,
  RefreshCw,
} from "lucide-react";
import { UnifiedAppointmentSheet } from "./unified-appointment-sheet";
import type {
  Booking,
  Patient,
  User as UserType,
  Clinic,
} from "@prisma/client";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "../ui/input-group";
import { useQueryState, parseAsIsoDateTime, parseAsString } from "nuqs";
import AppointmentCard from "./appointment-card";
import { toast } from "sonner";
import { Separator } from "../ui/separator";

type BookingWithRelations = Booking & {
  Patient: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    gender: string;
    dob: Date;
  };
  User: Pick<UserType, "id" | "name" | "email" | "title"> | null;
  Clinic: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  };
};

interface AppointmentsAgendaProps {
  initialBookings: BookingWithRelations[];
  currentUserId: string;
  activeClinicId: string;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    icon: Clock3,
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCheck,
    color: "bg-green-100 text-green-800 border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-100 text-red-800 border-red-200",
  },
  NO_SHOW: {
    label: "No Show",
    icon: UserX,
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

export function AppointmentsAgenda({
  initialBookings,
  currentUserId,
  activeClinicId,
}: AppointmentsAgendaProps) {
  const [bookings, setBookings] =
    useState<BookingWithRelations[]>(initialBookings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithRelations | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [statusFilter, setStatusFilter] = useQueryState("status", {
    defaultValue: "all",
  });
  const [timeFilter, setTimeFilter] = useQueryState("time", {
    defaultValue: "all",
  });
  const [selectedDate, setSelectedDate] = useQueryState(
    "date",
    parseAsString.withDefault(""),
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch appointments from the backend
  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments/list");
      if (!response.ok) throw new Error("Failed to fetch appointments");
      const data = await response.json();
      setBookings(data);
      return data;
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Failed to refresh appointments");
      return bookings;
    }
  };

  // Refresh appointments manually
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAppointments();
    setIsRefreshing(false);
    toast.success("Appointments refreshed");
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAppointments();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Filter out bookings without Patient data
      if (!booking.Patient || !booking.Clinic) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesPatient = booking.Patient.name
          .toLowerCase()
          .includes(query);
        const matchesDoctor = booking.User?.name?.toLowerCase().includes(query);
        const matchesClinic = booking.Clinic.name.toLowerCase().includes(query);
        const matchesReason = booking.reason?.toLowerCase().includes(query);

        if (
          !matchesPatient &&
          !matchesDoctor &&
          !matchesClinic &&
          !matchesReason
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }

      const bookingDate = new Date(booking.start);

      // Date Picker filter (takes precedence over time filter)
      if (selectedDate) {
        const selected = new Date(selectedDate);
        if (!isSameDay(bookingDate, selected)) {
          return false;
        }
      } else if (timeFilter !== "all") {
        // Time filter (only applied if no specific date is selected)
        switch (timeFilter) {
          case "today":
            if (!isToday(bookingDate)) return false;
            break;
          case "tomorrow":
            if (!isTomorrow(bookingDate)) return false;
            break;
          case "week":
            if (!isThisWeek(bookingDate)) return false;
            break;
          case "month":
            if (!isThisMonth(bookingDate)) return false;
            break;
          case "past":
            if (!isPast(bookingDate) || isToday(bookingDate)) return false;
            break;
          case "upcoming":
            if (!isFuture(bookingDate) && !isToday(bookingDate)) return false;
            break;
        }
      }

      return true;
    }) as BookingWithRelations[];
  }, [bookings, searchQuery, statusFilter, timeFilter, selectedDate]);

  const groupedBookings = useMemo(() => {
    const groups: Record<string, BookingWithRelations[]> = {};

    filteredBookings.forEach((booking) => {
      const dateKey = format(new Date(booking.start), "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(booking);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBookings]);

  const handleAppointmentClick = (booking: BookingWithRelations) => {
    setSelectedBooking(booking);
    setIsDetailsOpen(true);
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);

    if (isToday(date)) {
      return `Today, ${format(date, "MMMM d, yyyy")}`;
    }
    if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, "MMMM d, yyyy")}`;
    }

    return format(date, "EEEE, MMMM d, yyyy");
  };

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: bookings.length,
      today: bookings.filter((b) => isToday(new Date(b.start))).length,
      pending: bookings.filter((b) => b.status === "PENDING").length,
      upcoming: bookings.filter((b) => new Date(b.start) > now).length,
    };
  }, [bookings]);

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
          </div>
          <InputGroup className="max-w-sm">
            <InputGroupInput
              placeholder="Search by patient, doctor, clinic, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <InputGroupAddon>
              <Search className="h-4 w-4" />
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Today</div>
            <div className="text-2xl font-bold">{stats.today}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Upcoming</div>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </Card>
        </div>

        {/* Appointments Table */}
        {groupedBookings.length === 0 ? (
          <Card>
            <div className="text-center p-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                No appointments found
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ||
                statusFilter !== "all" ||
                timeFilter !== "all" ||
                selectedDate
                  ? "Try adjusting your filters to see more results."
                  : "You don't have any appointments yet."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {groupedBookings.map(([dateStr, dayBookings]) => (
              <div key={dateStr}>
                {/* Date Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">
                      {getDateLabel(dateStr)}
                    </h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <Badge variant={"secondary"}>
                      {dayBookings.length} appointment
                      {dayBookings.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>

                {/* Appointments Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 pl-4 border-l-2 border-dashed">
                  {dayBookings.map((booking) => (
                    <AppointmentCard
                      key={booking.id}
                      booking={booking}
                      onClick={() => handleAppointmentClick(booking)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Sidebar - Combined Calendar & Filters */}

      {isClient && (
        <Card size="sm" className="h-fit">
          <CardContent className="flex flex-col justify-center items-center gap-2">
            {/* Calendar Section */}
            <CalendarComponent
              mode="single"
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(format(date, "yyyy-MM-dd"));
                  // Clear time filter when date is selected
                  if (timeFilter !== "all") {
                    setTimeFilter("all");
                  }
                } else {
                  setSelectedDate("");
                }
              }}
              className="rounded-md border-0"
            />

            <Separator className="w-full" />

            {/* Filters Section */}
            <div className="space-y-2 w-full">
              <div className="space-y-2">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="NO_SHOW">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Time Range</Label>
                  <Select
                    value={timeFilter}
                    onValueChange={(value) => {
                      setTimeFilter(value);
                      // Clear date filter when time range is selected
                      if (value !== "all" && selectedDate) {
                        setSelectedDate("");
                      }
                    }}
                    disabled={!!selectedDate}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedDate && (
                    <p className="text-xs text-muted-foreground">
                      Range disabled when date is selected
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              disabled={
                statusFilter === "all" && timeFilter === "all" && !selectedDate
              }
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setTimeFilter("all");
                setSelectedDate("");
              }}
              className="h-auto p-1 text-xs"
            >
              Reset
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Appointment Details Sheet */}
      {selectedBooking && (
        <UnifiedAppointmentSheet
          booking={selectedBooking}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          onStatusUpdate={() => {
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
}
