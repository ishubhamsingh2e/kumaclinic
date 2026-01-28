"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import * as Icons from "lucide-react";

interface Widget {
  id: string;
  name: string;
  type: string;
  componentName: string | null;
  description: string | null;
  icon: string | null;
  specialty: string | null;
}

interface WidgetLibraryProps {
  availableWidgets: Widget[];
  addedWidgetIds: string[];
  onAddWidget: (widgetId: string) => void;
}

export function WidgetLibrary({
  availableWidgets,
  addedWidgetIds,
  onAddWidget,
}: WidgetLibraryProps) {
  const [open, setOpen] = useState(false);

  // Group widgets by specialty
  const commonWidgets = availableWidgets.filter(w => !w.specialty);
  const specialtyWidgets = availableWidgets.filter(w => w.specialty);
  
  const specialtyGroups = specialtyWidgets.reduce((acc, widget) => {
    const specialty = widget.specialty || "Other";
    if (!acc[specialty]) acc[specialty] = [];
    acc[specialty].push(widget);
    return acc;
  }, {} as Record<string, Widget[]>);

  const renderWidgetCard = (widget: Widget) => {
    const isAdded = addedWidgetIds.includes(widget.id);
    const IconComponent = widget.icon ? (Icons as any)[widget.icon] : null;

    return (
      <Card key={widget.id} className={isAdded ? "opacity-50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
              <CardTitle className="text-base">{widget.name}</CardTitle>
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={isAdded}
              onClick={() => {
                onAddWidget(widget.id);
                setOpen(false);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {widget.description && (
            <CardDescription className="text-sm">{widget.description}</CardDescription>
          )}
        </CardHeader>
        {isAdded && (
          <CardContent className="pt-0">
            <Badge variant="secondary" className="text-xs">Already added</Badge>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Widget
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Widget Library</SheetTitle>
          <SheetDescription>
            Add widgets to your prescription layout
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Common Widgets */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Common Widgets</h3>
            <div className="grid gap-3">
              {commonWidgets.map(renderWidgetCard)}
            </div>
          </div>

          {/* Specialty-specific Widgets */}
          {Object.entries(specialtyGroups).map(([specialty, widgets]) => (
            <div key={specialty}>
              <h3 className="text-sm font-semibold mb-3">
                {specialty.charAt(0) + specialty.slice(1).toLowerCase()} Widgets
              </h3>
              <div className="grid gap-3">
                {widgets.map(renderWidgetCard)}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
