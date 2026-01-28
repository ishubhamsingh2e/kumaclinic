"use client";

import { LayoutEditor } from "@/components/prescription/widgets/layout-editor";

export default function PrescriptionLayoutPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Prescription Layout Editor</h1>
        <p className="text-muted-foreground">
          Customize your prescription page by adding, removing, and reordering widgets.
        </p>
      </div>

      <LayoutEditor />
    </div>
  );
}
