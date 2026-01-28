"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock } from "lucide-react";

interface NotesData {
  notes?: string;
}

interface NotesWidgetProps {
  data?: NotesData;
  onChange?: (data: NotesData) => void;
  readOnly?: boolean;
}

export function NotesWidget({ data = {}, onChange, readOnly = false }: NotesWidgetProps) {
  const [notes, setNotes] = useState<NotesData>(data);

  const handleChange = (value: string) => {
    const updated = { notes: value };
    setNotes(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          These notes are private and will not be visible to the patient.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="doctor-notes">Private Doctor Notes</Label>
        <Textarea
          id="doctor-notes"
          placeholder="Your private notes about this consultation..."
          value={notes.notes || ""}
          onChange={(e) => handleChange(e.target.value)}
          readOnly={readOnly}
          rows={6}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}
