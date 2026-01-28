"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VitalsData {
  bloodPressureSystolic?: string;
  bloodPressureDiastolic?: string;
  pulse?: string;
  temperature?: string;
  height?: string;
  weight?: string;
  spo2?: string;
  respiratoryRate?: string;
}

interface VitalsWidgetProps {
  data?: VitalsData;
  onChange?: (data: VitalsData) => void;
  readOnly?: boolean;
}

export function VitalsWidget({ data = {}, onChange, readOnly = false }: VitalsWidgetProps) {
  const [vitals, setVitals] = useState<VitalsData>(data);

  const handleChange = (field: keyof VitalsData, value: string) => {
    const updated = { ...vitals, [field]: value };
    setVitals(updated);
    onChange?.(updated);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Blood Pressure */}
      <div className="space-y-2">
        <Label htmlFor="bp">Blood Pressure (mmHg)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="bp-systolic"
            type="number"
            placeholder="120"
            value={vitals.bloodPressureSystolic || ""}
            onChange={(e) => handleChange("bloodPressureSystolic", e.target.value)}
            readOnly={readOnly}
            className="w-20"
          />
          <span className="text-muted-foreground">/</span>
          <Input
            id="bp-diastolic"
            type="number"
            placeholder="80"
            value={vitals.bloodPressureDiastolic || ""}
            onChange={(e) => handleChange("bloodPressureDiastolic", e.target.value)}
            readOnly={readOnly}
            className="w-20"
          />
        </div>
      </div>

      {/* Pulse */}
      <div className="space-y-2">
        <Label htmlFor="pulse">Pulse (bpm)</Label>
        <Input
          id="pulse"
          type="number"
          placeholder="72"
          value={vitals.pulse || ""}
          onChange={(e) => handleChange("pulse", e.target.value)}
          readOnly={readOnly}
        />
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label htmlFor="temperature">Temperature (°F)</Label>
        <Input
          id="temperature"
          type="number"
          step="0.1"
          placeholder="98.6"
          value={vitals.temperature || ""}
          onChange={(e) => handleChange("temperature", e.target.value)}
          readOnly={readOnly}
        />
      </div>

      {/* SpO2 */}
      <div className="space-y-2">
        <Label htmlFor="spo2">SpO2 (%)</Label>
        <Input
          id="spo2"
          type="number"
          placeholder="98"
          value={vitals.spo2 || ""}
          onChange={(e) => handleChange("spo2", e.target.value)}
          readOnly={readOnly}
        />
      </div>

      {/* Height */}
      <div className="space-y-2">
        <Label htmlFor="height">Height (cm)</Label>
        <Input
          id="height"
          type="number"
          step="0.1"
          placeholder="170"
          value={vitals.height || ""}
          onChange={(e) => handleChange("height", e.target.value)}
          readOnly={readOnly}
        />
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          placeholder="70"
          value={vitals.weight || ""}
          onChange={(e) => handleChange("weight", e.target.value)}
          readOnly={readOnly}
        />
      </div>

      {/* Respiratory Rate */}
      <div className="space-y-2">
        <Label htmlFor="rr">Respiratory Rate (breaths/min)</Label>
        <Input
          id="rr"
          type="number"
          placeholder="16"
          value={vitals.respiratoryRate || ""}
          onChange={(e) => handleChange("respiratoryRate", e.target.value)}
          readOnly={readOnly}
        />
      </div>

      {/* BMI - Calculated */}
      {vitals.height && vitals.weight && (
        <div className="space-y-2">
          <Label>BMI</Label>
          <div className="h-10 flex items-center text-lg font-semibold">
            {(
              parseFloat(vitals.weight) /
              Math.pow(parseFloat(vitals.height) / 100, 2)
            ).toFixed(1)}
          </div>
        </div>
      )}
    </div>
  );
}
