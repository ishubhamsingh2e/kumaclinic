// Field types supported in JSON forms
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "tel"
  | "date"
  | "time"
  | "datetime"
  | "select"
  | "radio"
  | "checkbox"
  | "switch"
  | "slider";

// Validation rule types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

// Field option for select/radio
export interface FieldOption {
  label: string;
  value: string | number;
}

// Individual field definition
export interface FieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  options?: FieldOption[]; // For select, radio, checkbox
  validation?: ValidationRule;
  description?: string;
  gridColumn?: string; // e.g., "span 2" for grid layout
  dependsOn?: {
    field: string;
    value: any;
  };
}

// Section to group fields
export interface FieldSection {
  id: string;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  gridColumns?: number; // Number of columns in grid (default: 2)
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// Complete widget form schema
export interface WidgetFormSchema {
  id: string;
  name: string;
  description?: string;
  sections: FieldSection[];
}

// Form data structure (values)
export type FormData = Record<string, any>;

// Default widget templates
export const DEFAULT_TEMPLATES = {
  vitals: {
    id: "vitals",
    name: "Vitals",
    description: "Record patient vital signs",
    sections: [
      {
        id: "basic-vitals",
        title: "Basic Vitals",
        gridColumns: 2,
        fields: [
          {
            id: "bloodPressureSystolic",
            type: "number" as FieldType,
            label: "BP Systolic",
            placeholder: "120",
            validation: { min: 50, max: 250, message: "Enter valid BP" },
            gridColumn: "span 1",
          },
          {
            id: "bloodPressureDiastolic",
            type: "number" as FieldType,
            label: "BP Diastolic",
            placeholder: "80",
            validation: { min: 30, max: 150, message: "Enter valid BP" },
            gridColumn: "span 1",
          },
          {
            id: "pulse",
            type: "number" as FieldType,
            label: "Pulse (bpm)",
            placeholder: "72",
            validation: { min: 30, max: 200 },
            gridColumn: "span 1",
          },
          {
            id: "temperature",
            type: "number" as FieldType,
            label: "Temperature (°F)",
            placeholder: "98.6",
            validation: { min: 90, max: 110 },
            gridColumn: "span 1",
          },
          {
            id: "respiratoryRate",
            type: "number" as FieldType,
            label: "Respiratory Rate",
            placeholder: "16",
            validation: { min: 8, max: 40 },
            gridColumn: "span 1",
          },
          {
            id: "oxygenSaturation",
            type: "number" as FieldType,
            label: "SpO2 (%)",
            placeholder: "98",
            validation: { min: 50, max: 100 },
            gridColumn: "span 1",
          },
        ],
      },
      {
        id: "measurements",
        title: "Measurements",
        gridColumns: 2,
        fields: [
          {
            id: "height",
            type: "number" as FieldType,
            label: "Height (cm)",
            placeholder: "170",
            validation: { min: 50, max: 250 },
            gridColumn: "span 1",
          },
          {
            id: "weight",
            type: "number" as FieldType,
            label: "Weight (kg)",
            placeholder: "70",
            validation: { min: 1, max: 300 },
            gridColumn: "span 1",
          },
        ],
      },
    ],
  },
  complaints: {
    id: "complaints",
    name: "Complaints",
    description: "Chief complaints and history",
    sections: [
      {
        id: "complaints-section",
        title: "Patient Complaints",
        gridColumns: 1,
        fields: [
          {
            id: "chiefComplaint",
            type: "textarea" as FieldType,
            label: "Chief Complaint",
            placeholder: "Describe the main complaint...",
            validation: { required: true, minLength: 5 },
            gridColumn: "span 1",
          },
          {
            id: "duration",
            type: "text" as FieldType,
            label: "Duration",
            placeholder: "e.g., 3 days",
            gridColumn: "span 1",
          },
          {
            id: "history",
            type: "textarea" as FieldType,
            label: "History of Present Illness",
            placeholder: "Detailed history...",
            gridColumn: "span 1",
          },
        ],
      },
    ],
  },
  diagnosis: {
    id: "diagnosis",
    name: "Diagnosis",
    description: "Clinical diagnosis with ICD codes",
    sections: [
      {
        id: "diagnosis-section",
        title: "Diagnosis Details",
        gridColumns: 2,
        fields: [
          {
            id: "diagnosis",
            type: "text" as FieldType,
            label: "Diagnosis",
            placeholder: "Enter diagnosis",
            validation: { required: true },
            gridColumn: "span 1",
          },
          {
            id: "icdCode",
            type: "text" as FieldType,
            label: "ICD Code",
            placeholder: "e.g., J00",
            gridColumn: "span 1",
          },
          {
            id: "notes",
            type: "textarea" as FieldType,
            label: "Clinical Notes",
            placeholder: "Additional notes...",
            gridColumn: "span 2",
          },
        ],
      },
    ],
  },
  advice: {
    id: "advice",
    name: "Advice",
    description: "Post-consultation advice",
    sections: [
      {
        id: "advice-section",
        title: "Patient Advice",
        gridColumns: 1,
        fields: [
          {
            id: "generalAdvice",
            type: "textarea" as FieldType,
            label: "General Advice",
            placeholder: "General instructions for the patient...",
            gridColumn: "span 1",
          },
          {
            id: "dietaryAdvice",
            type: "textarea" as FieldType,
            label: "Dietary Advice",
            placeholder: "Dietary recommendations...",
            gridColumn: "span 1",
          },
          {
            id: "activityRestrictions",
            type: "textarea" as FieldType,
            label: "Activity Restrictions",
            placeholder: "Any restrictions on activities...",
            gridColumn: "span 1",
          },
        ],
      },
    ],
  },
  followUp: {
    id: "followUp",
    name: "Follow-up",
    description: "Next visit schedule",
    sections: [
      {
        id: "followup-section",
        title: "Follow-up Details",
        gridColumns: 2,
        fields: [
          {
            id: "nextVisitDate",
            type: "date" as FieldType,
            label: "Next Visit Date",
            gridColumn: "span 1",
          },
          {
            id: "daysAfter",
            type: "number" as FieldType,
            label: "Days After",
            placeholder: "e.g., 7",
            validation: { min: 1, max: 365 },
            gridColumn: "span 1",
          },
          {
            id: "instructions",
            type: "textarea" as FieldType,
            label: "Instructions",
            placeholder: "Follow-up instructions...",
            gridColumn: "span 2",
          },
        ],
      },
    ],
  },
  notes: {
    id: "notes",
    name: "Notes",
    description: "Private doctor notes",
    sections: [
      {
        id: "notes-section",
        title: "Clinical Notes",
        gridColumns: 1,
        fields: [
          {
            id: "privateNotes",
            type: "textarea" as FieldType,
            label: "Private Notes",
            placeholder: "Notes for doctor's reference only...",
            description: "These notes are not visible to the patient",
            gridColumn: "span 1",
          },
        ],
      },
    ],
  },
};
