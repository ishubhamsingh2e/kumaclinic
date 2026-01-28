import { VitalsWidget } from "./vitals-widget";
import { ComplaintsWidget } from "./complaints-widget";
import { DiagnosisWidget } from "./diagnosis-widget";
import { AdviceWidget } from "./advice-widget";
import { FollowUpWidget } from "./follow-up-widget";
import { NotesWidget } from "./notes-widget";

// Widget registry - maps component names to actual React components
export const WIDGET_REGISTRY = {
  VitalsWidget,
  ComplaintsWidget,
  DiagnosisWidget,
  AdviceWidget,
  FollowUpWidget,
  NotesWidget,
  // Add more system widgets here as they're created
  // PrescriptionWidget,
  // LabOrdersWidget,
  // DentalChartWidget,
  // etc.
} as const;

export type WidgetComponentName = keyof typeof WIDGET_REGISTRY;

// Helper to check if a component exists in the registry
export function isValidWidgetComponent(componentName: string): componentName is WidgetComponentName {
  return componentName in WIDGET_REGISTRY;
}

// Helper to get a widget component by name
export function getWidgetComponent(componentName: string) {
  if (isValidWidgetComponent(componentName)) {
    return WIDGET_REGISTRY[componentName];
  }
  return null;
}
