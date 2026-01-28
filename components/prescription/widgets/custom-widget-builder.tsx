"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { toast } from "sonner";
import {
  FieldDefinition,
  FieldSection,
  FieldType,
  WidgetFormSchema,
  DEFAULT_TEMPLATES,
} from "@/lib/widget-form-schema";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkbox" },
  { value: "switch", label: "Toggle Switch" },
];

interface CustomWidgetBuilderProps {
  onSave?: (schema: WidgetFormSchema) => void;
}

export function CustomWidgetBuilder({ onSave }: CustomWidgetBuilderProps) {
  const [open, setOpen] = useState(false);
  const [widgetName, setWidgetName] = useState("");
  const [widgetDescription, setWidgetDescription] = useState("");
  const [sections, setSections] = useState<FieldSection[]>([
    {
      id: "section-1",
      title: "Section 1",
      fields: [],
      gridColumns: 2,
    },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const loadTemplate = (templateKey: string) => {
    const template = DEFAULT_TEMPLATES[templateKey as keyof typeof DEFAULT_TEMPLATES];
    if (template) {
      setWidgetName(template.name);
      setWidgetDescription(template.description || "");
      setSections(template.sections);
      toast.success(`Template "${template.name}" loaded`);
    }
  };

  const addSection = () => {
    const newSection: FieldSection = {
      id: `section-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      fields: [],
      gridColumns: 2,
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (sectionId: string, updates: Partial<FieldSection>) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    );
  };

  const removeSection = (sectionId: string) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const addField = (sectionId: string) => {
    const newField: FieldDefinition = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
      gridColumn: "span 1",
    };

    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, fields: [...section.fields, newField] }
          : section
      )
    );
  };

  const updateField = (
    sectionId: string,
    fieldId: string,
    updates: Partial<FieldDefinition>
  ) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.map((field) =>
                field.id === fieldId ? { ...field, ...updates } : field
              ),
            }
          : section
      )
    );
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: section.fields.filter((field) => field.id !== fieldId),
            }
          : section
      )
    );
  };

  const handleSave = () => {
    if (!widgetName.trim()) {
      toast.error("Please enter a widget name");
      return;
    }

    if (sections.length === 0 || sections.every((s) => s.fields.length === 0)) {
      toast.error("Please add at least one field");
      return;
    }

    const schema: WidgetFormSchema = {
      id: `custom-${Date.now()}`,
      name: widgetName,
      description: widgetDescription,
      sections,
    };

    onSave?.(schema);
    toast.success("Custom widget created successfully!");
    setOpen(false);

    // Reset form
    setWidgetName("");
    setWidgetDescription("");
    setSections([{ id: "section-1", title: "Section 1", fields: [], gridColumns: 2 }]);
    setSelectedTemplate("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Widget
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Custom Widget Builder</SheetTitle>
          <SheetDescription>
            Create a custom form widget with your own fields and layout
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Template selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Start from Template (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplate} onValueChange={(val) => {
                setSelectedTemplate(val);
                loadTemplate(val);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DEFAULT_TEMPLATES).map(([key, template]) => (
                    <SelectItem key={key} value={key}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Widget Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Widget Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="widgetName">Widget Name *</Label>
                <Input
                  id="widgetName"
                  value={widgetName}
                  onChange={(e) => setWidgetName(e.target.value)}
                  placeholder="e.g., Custom Examination"
                />
              </div>
              <div>
                <Label htmlFor="widgetDescription">Description</Label>
                <Textarea
                  id="widgetDescription"
                  value={widgetDescription}
                  onChange={(e) => setWidgetDescription(e.target.value)}
                  placeholder="Brief description of this widget"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          {sections.map((section, sectionIndex) => (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <Input
                      value={section.title}
                      onChange={(e) =>
                        updateSection(section.id, { title: e.target.value })
                      }
                      placeholder="Section title"
                      className="font-semibold"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection(section.id)}
                    disabled={sections.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Grid columns selector */}
                <div className="flex items-center gap-4">
                  <Label>Grid Columns:</Label>
                  <Select
                    value={String(section.gridColumns || 2)}
                    onValueChange={(val) =>
                      updateSection(section.id, { gridColumns: parseInt(val) })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Column</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Fields */}
                <div className="space-y-3">
                  {section.fields.map((field, fieldIndex) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Field Label</Label>
                            <Input
                              value={field.label}
                              onChange={(e) =>
                                updateField(section.id, field.id, {
                                  label: e.target.value,
                                })
                              }
                              placeholder="Field label"
                              size-sm
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Field Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(val) =>
                                updateField(section.id, field.id, {
                                  type: val as FieldType,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Placeholder</Label>
                            <Input
                              value={field.placeholder || ""}
                              onChange={(e) =>
                                updateField(section.id, field.id, {
                                  placeholder: e.target.value,
                                })
                              }
                              placeholder="Placeholder text"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Column Span</Label>
                            <Select
                              value={field.gridColumn || "span 1"}
                              onValueChange={(val) =>
                                updateField(section.id, field.id, {
                                  gridColumn: val,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="span 1">1 Column</SelectItem>
                                <SelectItem value="span 2">2 Columns</SelectItem>
                                <SelectItem value="span 3">3 Columns</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`required-${field.id}`}
                                checked={field.validation?.required || false}
                                onCheckedChange={(checked) =>
                                  updateField(section.id, field.id, {
                                    validation: {
                                      ...field.validation,
                                      required: checked as boolean,
                                    },
                                  })
                                }
                              />
                              <Label htmlFor={`required-${field.id}`} className="text-xs">
                                Required
                              </Label>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(section.id, field.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addField(section.id)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={addSection} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>

          {/* Save Button */}
          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Create Widget
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
