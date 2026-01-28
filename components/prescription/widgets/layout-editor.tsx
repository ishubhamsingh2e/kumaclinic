"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { WidgetWrapper } from "./widget-wrapper";
import { WidgetLibrary } from "./widget-library";
import { getWidgetComponent } from "./widget-registry";
import { toast } from "sonner";
import { Loader2, Save, LayoutGrid } from "lucide-react";
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

interface DoctorWidget {
  id: string;
  widgetId: string;
  position: number;
  visible: boolean;
  width: string;
  columnSpan: number;
  config: any;
  Widget: Widget;
}

interface LayoutEditorProps {
  prescriptionId?: string;
  onSave?: () => void;
}

// Widget wrapper with controls
function WidgetWithControls({
  doctorWidget,
  index,
  total,
  onToggleVisibility,
  onChangeColumnSpan,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  doctorWidget: DoctorWidget;
  index: number;
  total: number;
  onToggleVisibility: () => void;
  onChangeColumnSpan: (span: number) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const widget = doctorWidget.Widget;
  const IconComponent = widget.icon ? (Icons as any)[widget.icon] : null;

  // Get widget component for preview
  const WidgetComponent = widget.componentName
    ? getWidgetComponent(widget.componentName)
    : null;

  return (
    <div 
      className="relative group"
      style={{ gridColumn: `span ${doctorWidget.columnSpan || 6}` }}
    >
      <WidgetWrapper
        id={widget.id}
        title={widget.name}
        description={widget.description || undefined}
        icon={IconComponent ? <IconComponent className="h-5 w-5" /> : undefined}
        width={doctorWidget.width as "full" | "half"}
        visible={doctorWidget.visible}
        isEditMode={true}
        onToggleVisibility={onToggleVisibility}
        onRemove={onRemove}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        canMoveUp={index > 0}
        canMoveDown={index < total - 1}
        columnSpan={doctorWidget.columnSpan || 6}
        onChangeColumnSpan={onChangeColumnSpan}
      >
        {WidgetComponent ? (
          <div className="pointer-events-none opacity-50">
            <WidgetComponent
              data={undefined as any}
              onChange={() => {}}
              readOnly={true}
            />
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            {widget.type === "custom"
              ? "Custom widget"
              : "Preview not available"}
          </div>
        )}
      </WidgetWrapper>
    </div>
  );
}

export function LayoutEditor({ prescriptionId, onSave }: LayoutEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets, setWidgets] = useState<DoctorWidget[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load layout and available widgets
  useEffect(() => {
    loadLayout();
    loadAvailableWidgets();
  }, []);

  const loadLayout = async () => {
    try {
      const response = await fetch("/api/doctor/layout");
      if (!response.ok) throw new Error("Failed to load layout");
      const data = await response.json();
      setWidgets(data.widgets || []);
    } catch (error) {
      toast.error("Failed to load layout");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableWidgets = async () => {
    try {
      const response = await fetch("/api/widgets");
      if (!response.ok) throw new Error("Failed to load widgets");
      const data = await response.json();
      setAvailableWidgets(data.widgets || []);
    } catch (error) {
      console.error("Failed to load available widgets:", error);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    setWidgets((items) => {
      const newItems = [...items];
      [newItems[index - 1], newItems[index]] = [
        newItems[index],
        newItems[index - 1],
      ];

      // Update positions
      return newItems.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === widgets.length - 1) return;

    setWidgets((items) => {
      const newItems = [...items];
      [newItems[index], newItems[index + 1]] = [
        newItems[index + 1],
        newItems[index],
      ];

      // Update positions
      return newItems.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));
    });
  };

  const handleChangeColumnSpan = (widgetId: string, span: number) => {
    setWidgets((items) =>
      items.map((item) =>
        item.Widget.id === widgetId
          ? { ...item, columnSpan: span }
          : item,
      ),
    );
  };

  const handleToggleVisibility = (widgetId: string) => {
    setWidgets((items) =>
      items.map((item) =>
        item.Widget.id === widgetId
          ? { ...item, visible: !item.visible }
          : item,
      ),
    );
  };



  const handleRemove = (widgetId: string) => {
    setWidgets((items) => items.filter((item) => item.Widget.id !== widgetId));
  };

  const handleAddWidget = (widgetId: string) => {
    const widget = availableWidgets.find((w) => w.id === widgetId);
    if (!widget) return;

    const newDoctorWidget: DoctorWidget = {
      id: `temp-${Date.now()}`, // Temporary ID
      widgetId: widget.id,
      position: widgets.length + 1,
      visible: true,
      width: "full",
      columnSpan: 6,
      config: {},
      Widget: widget,
    };

    setWidgets((items) => [...items, newDoctorWidget]);
    toast.success(`${widget.name} added to layout`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        widgets: widgets.map((w) => ({
          widgetId: w.Widget.id,
          position: w.position,
          visible: w.visible,
          width: w.width,
          columnSpan: w.columnSpan || 6,
          config: w.config,
        })),
      };

      const response = await fetch("/api/doctor/layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save layout");

      toast.success("Layout saved successfully");
      setIsEditMode(false);
      onSave?.();

      // Reload to get proper IDs from server
      await loadLayout();
    } catch (error) {
      toast.error("Failed to save layout");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    loadLayout(); // Reload to discard changes
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Prescription Layout</h2>
        </div>
        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <WidgetLibrary
                availableWidgets={availableWidgets}
                addedWidgetIds={widgets.map((w) => w.Widget.id)}
                onAddWidget={handleAddWidget}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Layout
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(true)}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Customize Layout
            </Button>
          )}
        </div>
      </div>

      {/* Layout Display/Editor */}
      {widgets.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            No widgets added yet. {isEditMode ? 'Click "Add Widget" to get started.' : 'Click "Customize Layout" to add widgets.'}
          </p>
          {isEditMode && (
            <WidgetLibrary
              availableWidgets={availableWidgets}
              addedWidgetIds={[]}
              onAddWidget={handleAddWidget}
            />
          )}
        </div>
      ) : (
        <div className={isEditMode ? "border-2 border-dashed rounded-lg p-4" : ""}>
          <div className="grid grid-cols-6 gap-4">
            {widgets.map((doctorWidget, index) => {
              if (isEditMode) {
                return (
                  <WidgetWithControls
                    key={`${doctorWidget.id}-${doctorWidget.Widget.id}-${index}`}
                    doctorWidget={doctorWidget}
                    index={index}
                    total={widgets.length}
                    onToggleVisibility={() =>
                      handleToggleVisibility(doctorWidget.Widget.id)
                    }
                    onChangeColumnSpan={(span) =>
                      handleChangeColumnSpan(doctorWidget.Widget.id, span)
                    }
                    onRemove={() => handleRemove(doctorWidget.Widget.id)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                  />
                );
              } else {
                // Display mode - show only visible widgets without edit controls
                if (!doctorWidget.visible) return null;
                
                const widget = doctorWidget.Widget;
                const IconComponent = widget.icon ? (Icons as any)[widget.icon] : null;
                const WidgetComponent = widget.componentName
                  ? getWidgetComponent(widget.componentName)
                  : null;

                return (
                  <div
                    key={`${doctorWidget.id}-${doctorWidget.Widget.id}-${index}`}
                    style={{ gridColumn: `span ${doctorWidget.columnSpan || 6}` }}
                  >
                    <WidgetWrapper
                      id={widget.id}
                      title={widget.name}
                      description={widget.description || undefined}
                      icon={IconComponent ? <IconComponent className="h-5 w-5" /> : undefined}
                      width={doctorWidget.width as "full" | "half"}
                      visible={doctorWidget.visible}
                      isEditMode={false}
                    >
                      {WidgetComponent ? (
                        <div className="pointer-events-none opacity-50">
                          <WidgetComponent
                            data={undefined as any}
                            onChange={() => {}}
                            readOnly={true}
                          />
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm">
                          {widget.type === "custom"
                            ? "Custom widget preview"
                            : "Widget preview"}
                        </div>
                      )}
                    </WidgetWrapper>
                  </div>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
}
