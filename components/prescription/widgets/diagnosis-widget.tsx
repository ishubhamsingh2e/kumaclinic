"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from "lucide-react";

interface Diagnosis {
  id: string;
  code?: string;
  name: string;
  notes?: string;
}

interface DiagnosisWidgetProps {
  data?: Diagnosis[];
  onChange?: (data: Diagnosis[]) => void;
  readOnly?: boolean;
}

export function DiagnosisWidget({ data = [], onChange, readOnly = false }: DiagnosisWidgetProps) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(data.length > 0 ? data : [{ id: crypto.randomUUID(), name: "", code: "", notes: "" }]);

  const handleAdd = () => {
    const updated = [...diagnoses, { id: crypto.randomUUID(), name: "", code: "", notes: "" }];
    setDiagnoses(updated);
    onChange?.(updated);
  };

  const handleRemove = (id: string) => {
    const updated = diagnoses.filter((d) => d.id !== id);
    setDiagnoses(updated);
    onChange?.(updated);
  };

  const handleChange = (id: string, field: keyof Diagnosis, value: string) => {
    const updated = diagnoses.map((d) =>
      d.id === id ? { ...d, [field]: value } : d
    );
    setDiagnoses(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      {diagnoses.map((diagnosis, index) => (
        <div key={diagnosis.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`diagnosis-name-${diagnosis.id}`}>
                  Diagnosis {index + 1}
                </Label>
                <Input
                  id={`diagnosis-name-${diagnosis.id}`}
                  placeholder="e.g., Type 2 Diabetes Mellitus"
                  value={diagnosis.name}
                  onChange={(e) => handleChange(diagnosis.id, "name", e.target.value)}
                  readOnly={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`diagnosis-code-${diagnosis.id}`}>ICD Code</Label>
                <Input
                  id={`diagnosis-code-${diagnosis.id}`}
                  placeholder="e.g., E11.9"
                  value={diagnosis.code || ""}
                  onChange={(e) => handleChange(diagnosis.id, "code", e.target.value)}
                  readOnly={readOnly}
                />
              </div>
            </div>
            {!readOnly && diagnoses.length > 1 && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemove(diagnosis.id)}
                className="text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`diagnosis-notes-${diagnosis.id}`}>Notes</Label>
            <Textarea
              id={`diagnosis-notes-${diagnosis.id}`}
              placeholder="Additional notes..."
              value={diagnosis.notes || ""}
              onChange={(e) => handleChange(diagnosis.id, "notes", e.target.value)}
              readOnly={readOnly}
              rows={2}
            />
          </div>
        </div>
      ))}
      {!readOnly && (
        <Button variant="outline" onClick={handleAdd} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Diagnosis
        </Button>
      )}
    </div>
  );
}
