"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ComplaintsData {
  chiefComplaints?: string;
  historyOfPresentIllness?: string;
  duration?: string;
}

interface ComplaintsWidgetProps {
  data?: ComplaintsData;
  onChange?: (data: ComplaintsData) => void;
  readOnly?: boolean;
}

export function ComplaintsWidget({ data = {}, onChange, readOnly = false }: ComplaintsWidgetProps) {
  const [complaints, setComplaints] = useState<ComplaintsData>(data);

  const handleChange = (field: keyof ComplaintsData, value: string) => {
    const updated = { ...complaints, [field]: value };
    setComplaints(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chief-complaints">Chief Complaints</Label>
        <Textarea
          id="chief-complaints"
          placeholder="Patient's main complaints..."
          value={complaints.chiefComplaints || ""}
          onChange={(e) => handleChange("chiefComplaints", e.target.value)}
          readOnly={readOnly}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="history">History of Present Illness</Label>
        <Textarea
          id="history"
          placeholder="Detailed history of the present illness..."
          value={complaints.historyOfPresentIllness || ""}
          onChange={(e) => handleChange("historyOfPresentIllness", e.target.value)}
          readOnly={readOnly}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duration</Label>
        <Textarea
          id="duration"
          placeholder="e.g., 3 days, 2 weeks, etc."
          value={complaints.duration || ""}
          onChange={(e) => handleChange("duration", e.target.value)}
          readOnly={readOnly}
          rows={2}
        />
      </div>
    </div>
  );
}
