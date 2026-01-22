"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { getSpecificOffDays, addSpecificOffDays, deleteSpecificOffDay } from "@/lib/actions/off-days";
import { toast } from "sonner";
import { CalendarIcon, Loader2, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SpecificOffDaysManagerProps {
  clinicId: string;
}

interface OffDay {
  id: string;
  date: Date;
  reason: string | null;
}

export function SpecificOffDaysManager({ clinicId }: SpecificOffDaysManagerProps) {
  const [offDays, setOffDays] = useState<OffDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; offDay: OffDay | null }>({
    open: false,
    offDay: null,
  });

  useEffect(() => {
    loadOffDays();
  }, [clinicId]);

  async function loadOffDays() {
    setLoading(true);
    const result = await getSpecificOffDays(clinicId);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    setOffDays(
      result.offDays?.map((d) => ({
        ...d,
        date: new Date(d.date),
      })) || []
    );
    setLoading(false);
  }

  const handleAddDates = async () => {
    if (selectedDates.length === 0) {
      toast.error("Please select at least one date");
      return;
    }

    setAdding(true);
    const result = await addSpecificOffDays(clinicId, selectedDates, reason || undefined);

    if (result.error) {
      toast.error(result.error);
      setAdding(false);
      return;
    }

    toast.success(`Added ${result.count} off day${result.count === 1 ? "" : "s"}`);
    setSelectedDates([]);
    setReason("");
    setAdding(false);
    loadOffDays();
  };

  const handleDelete = async () => {
    if (!deleteDialog.offDay) return;

    const result = await deleteSpecificOffDay(clinicId, deleteDialog.offDay.date);

    if (result.error) {
      toast.error(result.error);
      setDeleteDialog({ open: false, offDay: null });
      return;
    }

    toast.success("Off day deleted");
    setDeleteDialog({ open: false, offDay: null });
    loadOffDays();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Specific Off Days</CardTitle>
          <CardDescription>Mark specific dates when you are not available</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Specific Off Days</CardTitle>
          <CardDescription>
            Mark specific dates when you are not available (holidays, vacations, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Off Days */}
          <div className="space-y-4">
            <div>
              <Label>Select Dates</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      selectedDates.length === 0 && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDates.length > 0
                      ? `${selectedDates.length} date${selectedDates.length === 1 ? "" : "s"} selected`
                      : "Pick dates"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={(dates) => setSelectedDates(dates || [])}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedDates.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedDates
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map((d) => format(d, "MMM dd, yyyy"))
                    .join(", ")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                placeholder="e.g., Vacation, Holiday, Personal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2"
              />
            </div>

            <Button onClick={handleAddDates} disabled={adding || selectedDates.length === 0}>
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Off Days
            </Button>
          </div>

          {/* List of Existing Off Days */}
          {offDays.length > 0 && (
            <div className="space-y-2">
              <Label>Scheduled Off Days</Label>
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {offDays
                  .sort((a, b) => a.date.getTime() - b.date.getTime())
                  .map((offDay) => (
                    <div
                      key={offDay.id}
                      className="flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{format(offDay.date, "EEEE, MMMM dd, yyyy")}</p>
                        {offDay.reason && (
                          <p className="text-sm text-muted-foreground">{offDay.reason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteDialog({ open: true, offDay })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {offDays.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No specific off days scheduled
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, offDay: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Off Day</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {deleteDialog.offDay && format(deleteDialog.offDay.date, "MMMM dd, yyyy")}
              </strong>{" "}
              as an off day? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
