"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FollowUpData {
  nextVisitDate?: Date;
  instructions?: string;
  daysAfter?: string;
}

interface FollowUpWidgetProps {
  data?: FollowUpData;
  onChange?: (data: FollowUpData) => void;
  readOnly?: boolean;
}

export function FollowUpWidget({ data = {}, onChange, readOnly = false }: FollowUpWidgetProps) {
  const [followUp, setFollowUp] = useState<FollowUpData>(data);

  const handleDateChange = (date: Date | undefined) => {
    const updated = { ...followUp, nextVisitDate: date };
    setFollowUp(updated);
    onChange?.(updated);
  };

  const handleChange = (field: keyof FollowUpData, value: string) => {
    const updated = { ...followUp, [field]: value };
    setFollowUp(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Next Visit Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !followUp.nextVisitDate && "text-muted-foreground"
              )}
              disabled={readOnly}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {followUp.nextVisitDate ? (
                format(followUp.nextVisitDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={followUp.nextVisitDate}
              onSelect={handleDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="days-after">Or Days After</Label>
        <Input
          id="days-after"
          type="number"
          placeholder="e.g., 7, 14, 30"
          value={followUp.daysAfter || ""}
          onChange={(e) => handleChange("daysAfter", e.target.value)}
          readOnly={readOnly}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="follow-up-instructions">Follow-up Instructions</Label>
        <Textarea
          id="follow-up-instructions"
          placeholder="Instructions for next visit..."
          value={followUp.instructions || ""}
          onChange={(e) => handleChange("instructions", e.target.value)}
          readOnly={readOnly}
          rows={3}
        />
      </div>
    </div>
  );
}
