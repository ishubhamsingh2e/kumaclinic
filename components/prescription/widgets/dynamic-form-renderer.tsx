"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  FieldDefinition,
  FieldSection,
  WidgetFormSchema,
  FormData,
  ValidationRule,
} from "@/lib/widget-form-schema";
import DOMPurify from "isomorphic-dompurify";

interface DynamicFormRendererProps {
  schema: WidgetFormSchema;
  data?: FormData;
  onChange?: (data: FormData) => void;
  readOnly?: boolean;
}

// Sanitize input value
function sanitizeValue(value: any, fieldType: string): any {
  if (value === null || value === undefined) return value;

  switch (fieldType) {
    case "text":
    case "email":
    case "tel":
      return typeof value === "string" ? DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }) : value;
    case "textarea":
      return typeof value === "string" ? DOMPurify.sanitize(value, { ALLOWED_TAGS: [] }) : value;
    case "number":
      return typeof value === "number" ? value : parseFloat(value) || 0;
    default:
      return value;
  }
}

// Validate field value
function validateField(value: any, validation?: ValidationRule): string | null {
  if (!validation) return null;

  if (validation.required && !value) {
    return validation.message || "This field is required";
  }

  if (validation.minLength && typeof value === "string" && value.length < validation.minLength) {
    return validation.message || `Minimum ${validation.minLength} characters required`;
  }

  if (validation.maxLength && typeof value === "string" && value.length > validation.maxLength) {
    return validation.message || `Maximum ${validation.maxLength} characters allowed`;
  }

  if (validation.min !== undefined && typeof value === "number" && value < validation.min) {
    return validation.message || `Minimum value is ${validation.min}`;
  }

  if (validation.max !== undefined && typeof value === "number" && value > validation.max) {
    return validation.message || `Maximum value is ${validation.max}`;
  }

  if (validation.pattern && typeof value === "string") {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      return validation.message || "Invalid format";
    }
  }

  return null;
}

// Render individual field
function renderField(
  field: FieldDefinition,
  value: any,
  onChange: (value: any) => void,
  readOnly: boolean,
  error?: string | null
) {
  const commonProps = {
    id: field.id,
    disabled: readOnly,
    placeholder: field.placeholder,
  };

  switch (field.type) {
    case "text":
    case "email":
    case "tel":
    case "date":
    case "time":
    case "datetime":
      return (
        <Input
          {...commonProps}
          type={field.type}
          value={value || ""}
          onChange={(e) => onChange(sanitizeValue(e.target.value, field.type))}
          className={error ? "border-red-500" : ""}
        />
      );

    case "number":
      return (
        <Input
          {...commonProps}
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(sanitizeValue(e.target.value, field.type))}
          className={error ? "border-red-500" : ""}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      );

    case "textarea":
      return (
        <Textarea
          {...commonProps}
          value={value || ""}
          onChange={(e) => onChange(sanitizeValue(e.target.value, field.type))}
          className={error ? "border-red-500" : ""}
          rows={4}
        />
      );

    case "select":
      return (
        <Select
          value={value || ""}
          onValueChange={onChange}
          disabled={readOnly}
        >
          <SelectTrigger className={error ? "border-red-500" : ""}>
            <SelectValue placeholder={field.placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "radio":
      return (
        <RadioGroup
          value={value || ""}
          onValueChange={onChange}
          disabled={readOnly}
          className={error ? "border-red-500 border rounded p-2" : ""}
        >
          {field.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={String(option.value)} id={`${field.id}-${option.value}`} />
              <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      );

    case "checkbox":
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={field.id}
            checked={value || false}
            onCheckedChange={onChange}
            disabled={readOnly}
          />
          <Label htmlFor={field.id} className="text-sm font-normal">
            {field.label}
          </Label>
        </div>
      );

    case "switch":
      return (
        <div className="flex items-center space-x-2">
          <Switch
            id={field.id}
            checked={value || false}
            onCheckedChange={onChange}
            disabled={readOnly}
          />
          <Label htmlFor={field.id} className="text-sm font-normal">
            {field.label}
          </Label>
        </div>
      );

    case "slider":
      return (
        <div className="space-y-2">
          <Slider
            value={[value || field.validation?.min || 0]}
            onValueChange={(vals) => onChange(vals[0])}
            min={field.validation?.min}
            max={field.validation?.max}
            step={1}
            disabled={readOnly}
          />
          <div className="text-sm text-muted-foreground text-center">{value}</div>
        </div>
      );

    default:
      return <div className="text-sm text-muted-foreground">Unsupported field type: {field.type}</div>;
  }
}

export function DynamicFormRenderer({
  schema,
  data = {},
  onChange,
  readOnly = false,
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<FormData>(data);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Initialize collapsed state
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    schema.sections.forEach((section) => {
      if (section.collapsible) {
        initial[section.id] = section.defaultCollapsed || false;
      }
    });
    setCollapsedSections(initial);
  }, [schema]);

  // Update form data when external data changes
  useEffect(() => {
    setFormData(data);
  }, [data]);

  const handleFieldChange = (fieldId: string, value: any, validation?: ValidationRule) => {
    const newData = { ...formData, [fieldId]: value };
    setFormData(newData);

    // Validate
    const error = validateField(value, validation);
    setErrors((prev) => ({ ...prev, [fieldId]: error }));

    // Notify parent
    onChange?.(newData);
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className="space-y-6">
      {schema.sections.map((section) => {
        const SectionContent = () => (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${section.gridColumns || 2}, minmax(0, 1fr))`,
            }}
          >
            {section.fields.map((field) => {
              // Check field dependencies
              if (field.dependsOn) {
                const dependentValue = formData[field.dependsOn.field];
                if (dependentValue !== field.dependsOn.value) {
                  return null;
                }
              }

              const isCheckboxOrSwitch = field.type === "checkbox" || field.type === "switch";

              return (
                <div
                  key={field.id}
                  className="space-y-2"
                  style={{
                    gridColumn: field.gridColumn || "span 1",
                  }}
                >
                  {!isCheckboxOrSwitch && (
                    <Label htmlFor={field.id}>
                      {field.label}
                      {field.validation?.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                  )}
                  {renderField(
                    field,
                    formData[field.id],
                    (value) => handleFieldChange(field.id, value, field.validation),
                    readOnly,
                    errors[field.id]
                  )}
                  {field.description && (
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  )}
                  {errors[field.id] && (
                    <p className="text-sm text-red-500">{errors[field.id]}</p>
                  )}
                </div>
              );
            })}
          </div>
        );

        if (section.collapsible) {
          return (
            <Collapsible
              key={section.id}
              open={!collapsedSections[section.id]}
              onOpenChange={() => toggleSection(section.id)}
              className="border rounded-lg p-4 space-y-4"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <div>
                  <h3 className="text-lg font-semibold">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                </div>
                {collapsedSections[section.id] ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SectionContent />
              </CollapsibleContent>
            </Collapsible>
          );
        }

        return (
          <div key={section.id} className="border rounded-lg p-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{section.title}</h3>
              {section.description && (
                <p className="text-sm text-muted-foreground">{section.description}</p>
              )}
            </div>
            <SectionContent />
          </div>
        );
      })}
    </div>
  );
}
