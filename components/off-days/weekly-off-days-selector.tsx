"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeeklyOffDays, updateWeeklyOffDays } from "@/lib/actions/off-days";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface WeeklyOffDaysSelectorProps {
  clinicId: string;
  onUpdate?: () => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export function WeeklyOffDaysSelector({ clinicId, onUpdate }: WeeklyOffDaysSelectorProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [initialDays, setInitialDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOffDays();
  }, [clinicId]);

  async function loadOffDays() {
    setLoading(true);
    const result = await getWeeklyOffDays(clinicId);
    
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    setSelectedDays(result.offDays || []);
    setInitialDays(result.offDays || []);
    setLoading(false);
  }

  const toggleDay = (dayValue: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayValue)
        ? prev.filter((d) => d !== dayValue)
        : [...prev, dayValue].sort()
    );
  };

  const hasChanges = () => {
    if (selectedDays.length !== initialDays.length) return true;
    return !selectedDays.every((day) => initialDays.includes(day));
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateWeeklyOffDays(clinicId, selectedDays);

    if (result.error) {
      toast.error(result.error);
      setSaving(false);
      return;
    }

    toast.success("Weekly off days updated");
    setInitialDays([...selectedDays]);
    setSaving(false);
    
    // Call the onUpdate callback to refresh availability tabs
    if (onUpdate) {
      onUpdate();
    }
  };

  const handleReset = () => {
    setSelectedDays([...initialDays]);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Off Days</CardTitle>
          <CardDescription>Select days of the week when you are not available</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Off Days</CardTitle>
        <CardDescription>
          Select days of the week when you are not available at this clinic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.value}
              className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => toggleDay(day.value)}
            >
              <Checkbox
                id={`day-${day.value}`}
                checked={selectedDays.includes(day.value)}
                onCheckedChange={() => toggleDay(day.value)}
              />
              <Label
                htmlFor={`day-${day.value}`}
                className="cursor-pointer flex-1 font-medium"
              >
                {day.label}
              </Label>
            </div>
          ))}
        </div>

        {selectedDays.length > 0 && (
          <div className="text-sm text-muted-foreground">
            <strong>Selected:</strong>{" "}
            {selectedDays
              .map((d) => DAYS_OF_WEEK.find((day) => day.value === d)?.short)
              .join(", ")}
          </div>
        )}

        {hasChanges() && (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
