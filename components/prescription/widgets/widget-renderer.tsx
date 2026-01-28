"use client";

import { WidgetWrapper } from "./widget-wrapper";
import { getWidgetComponent } from "./widget-registry";
import * as Icons from "lucide-react";

interface Widget {
  id: string;
  name: string;
  type: string;
  componentName: string | null;
  description: string | null;
  icon: string | null;
}

interface DoctorWidget {
  id: string;
  widgetId: string;
  position: number;
  visible: boolean;
  width: string;
  columnSpan?: number;
  config: any;
  Widget: Widget;
}

interface WidgetRendererProps {
  widgets: DoctorWidget[];
  data?: Record<string, any>; // Widget data keyed by widgetId
  isEditMode?: boolean;
  onChange?: (widgetId: string, data: any) => void;
  onToggleVisibility?: (widgetId: string) => void;
  onToggleWidth?: (widgetId: string) => void;
  onRemove?: (widgetId: string) => void;
}

export function WidgetRenderer({
  widgets,
  data = {},
  isEditMode = false,
  onChange,
  onToggleVisibility,
  onToggleWidth,
  onRemove,
}: WidgetRendererProps) {
  // Sort widgets by position
  const sortedWidgets = [...widgets].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-wrap gap-4">
      {sortedWidgets.map((doctorWidget) => {
        const widget = doctorWidget.Widget;
        const widgetData = data[widget.id];

        // Get icon component
        const IconComponent = widget.icon
          ? (Icons as any)[widget.icon]
          : null;

        // For system widgets
        if (widget.type === "system" && widget.componentName) {
          const WidgetComponent = getWidgetComponent(widget.componentName);

          if (!WidgetComponent) {
            // Component not implemented yet
            return (
              <WidgetWrapper
                key={doctorWidget.id}
                id={widget.id}
                title={widget.name}
                description={widget.description || undefined}
                icon={IconComponent ? <IconComponent className="h-5 w-5" /> : undefined}
                width={doctorWidget.width as "full" | "half"}
                visible={doctorWidget.visible}
                isEditMode={isEditMode}
                onToggleVisibility={() => onToggleVisibility?.(widget.id)}
                onToggleWidth={() => onToggleWidth?.(widget.id)}
                onRemove={() => onRemove?.(widget.id)}
              >
                <div className="text-muted-foreground text-sm">
                  Widget component not implemented yet.
                </div>
              </WidgetWrapper>
            );
          }

          return (
            <WidgetWrapper
              key={doctorWidget.id}
              id={widget.id}
              title={widget.name}
              description={widget.description || undefined}
              icon={IconComponent ? <IconComponent className="h-5 w-5" /> : undefined}
              width={doctorWidget.width as "full" | "half"}
              visible={doctorWidget.visible}
              isEditMode={isEditMode}
              onToggleVisibility={() => onToggleVisibility?.(widget.id)}
              onToggleWidth={() => onToggleWidth?.(widget.id)}
              onRemove={() => onRemove?.(widget.id)}
            >
              <WidgetComponent
                data={widgetData}
                onChange={(newData: any) => onChange?.(widget.id, newData)}
                readOnly={isEditMode}
              />
            </WidgetWrapper>
          );
        }

        // For custom widgets
        if (widget.type === "custom") {
          return (
            <WidgetWrapper
              key={doctorWidget.id}
              id={widget.id}
              title={widget.name}
              description="Custom widget"
              icon={IconComponent ? <IconComponent className="h-5 w-5" /> : undefined}
              width={doctorWidget.width as "full" | "half"}
              visible={doctorWidget.visible}
              isEditMode={isEditMode}
              onToggleVisibility={() => onToggleVisibility?.(widget.id)}
              onToggleWidth={() => onToggleWidth?.(widget.id)}
              onRemove={() => onRemove?.(widget.id)}
            >
              <div className="text-sm text-muted-foreground">
                Custom widget renderer will be implemented in Phase 5
              </div>
            </WidgetWrapper>
          );
        }

        return null;
      })}
    </div>
  );
}
