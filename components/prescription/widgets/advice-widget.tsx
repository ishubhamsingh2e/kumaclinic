"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AdviceData {
  advice?: string;
  dietaryInstructions?: string;
  activityRestrictions?: string;
}

interface AdviceWidgetProps {
  data?: AdviceData;
  onChange?: (data: AdviceData) => void;
  readOnly?: boolean;
}

export function AdviceWidget({ data = {}, onChange, readOnly = false }: AdviceWidgetProps) {
  const [advice, setAdvice] = useState<AdviceData>(data);

  const handleChange = (field: keyof AdviceData, value: string) => {
    const updated = { ...advice, [field]: value };
    setAdvice(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="advice">General Advice</Label>
        <Textarea
          id="advice"
          placeholder="Post-consultation advice and instructions..."
          value={advice.advice || ""}
          onChange={(e) => handleChange("advice", e.target.value)}
          readOnly={readOnly}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dietary">Dietary Instructions</Label>
        <Textarea
          id="dietary"
          placeholder="Diet recommendations..."
          value={advice.dietaryInstructions || ""}
          onChange={(e) => handleChange("dietaryInstructions", e.target.value)}
          readOnly={readOnly}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="activity">Activity Restrictions</Label>
        <Textarea
          id="activity"
          placeholder="Activity limitations or recommendations..."
          value={advice.activityRestrictions || ""}
          onChange={(e) => handleChange("activityRestrictions", e.target.value)}
          readOnly={readOnly}
          rows={2}
        />
      </div>
    </div>
  );
}
