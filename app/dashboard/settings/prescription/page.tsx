"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { LayoutEditor } from "@/components/prescription/widgets/layout-editor";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, GripVertical, Save } from "lucide-react";
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

export default function PrescriptionSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("layout");

  // Custom widget builder state
  const [widgetName, setWidgetName] = useState("");
  const [widgetDescription, setWidgetDescription] = useState("");
  const [sections, setSections] = useState<FieldSection[]>([
    {
      id: "section_1",
      title: "Main Section",
      fields: [],
      gridColumns: 2,
    },
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleLoadTemplate = (templateKey: string) => {
    const template =
      DEFAULT_TEMPLATES[templateKey as keyof typeof DEFAULT_TEMPLATES];
    if (template) {
      setWidgetName(template.name);
      setWidgetDescription(template.description);
      setSections(template.sections);
      toast.success("Template loaded successfully");
    }
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        id: `section_${Date.now()}`,
        title: `Section ${sections.length + 1}`,
        fields: [],
        gridColumns: 2,
      },
    ]);
  };

  const handleRemoveSection = (sectionIndex: number) => {
    setSections(sections.filter((_, i) => i !== sectionIndex));
  };

  const handleAddField = (sectionIndex: number) => {
    const newSections = [...sections];
    const fieldId = `field_${Date.now()}`;
    newSections[sectionIndex].fields.push({
      id: fieldId,
      label: "New Field",
      type: "text",
      placeholder: "",
      validation: { required: false },
    });
    setSections(newSections);
  };

  const handleRemoveField = (sectionIndex: number, fieldIndex: number) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields = newSections[sectionIndex].fields.filter(
      (_, i) => i !== fieldIndex,
    );
    setSections(newSections);
  };

  const handleUpdateSection = (
    sectionIndex: number,
    updates: Partial<FieldSection>,
  ) => {
    const newSections = [...sections];
    newSections[sectionIndex] = { ...newSections[sectionIndex], ...updates };
    setSections(newSections);
  };

  const handleUpdateField = (
    sectionIndex: number,
    fieldIndex: number,
    updates: Partial<FieldDefinition>,
  ) => {
    const newSections = [...sections];
    newSections[sectionIndex].fields[fieldIndex] = {
      ...newSections[sectionIndex].fields[fieldIndex],
      ...updates,
    };
    setSections(newSections);
  };

  const handleSaveWidget = async () => {
    if (!widgetName.trim()) {
      toast.error("Please enter a widget name");
      return;
    }

    const schema: WidgetFormSchema = {
      id: `custom_${Date.now()}`,
      name: widgetName,
      description: widgetDescription,
      sections,
    };

    try {
      const response = await fetch("/api/widgets/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: widgetName,
          description: widgetDescription,
          schema,
        }),
      });

      if (!response.ok) throw new Error("Failed to save widget");

      toast.success("Custom widget created successfully!");

      // Reset form
      setWidgetName("");
      setWidgetDescription("");
      setSections([
        {
          id: "section_1",
          title: "Main Section",
          fields: [],
          gridColumns: 2,
        },
      ]);
      setSelectedTemplate("");
    } catch (error) {
      console.error("Error saving widget:", error);
      toast.error("Failed to save widget");
    }
  };

  return (
    <div className="mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Prescription Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Customize your prescription layout and create custom forms
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="custom">Create Widget</TabsTrigger>
        </TabsList>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <LayoutEditor />
        </TabsContent>

        {/* Create Custom Widget Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Widget</CardTitle>
              <CardDescription>
                Build a custom form with your own fields and layout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Widget Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="widget-name">Widget Name *</Label>
                  <Input
                    id="widget-name"
                    value={widgetName}
                    onChange={(e) => setWidgetName(e.target.value)}
                    placeholder="e.g., Dental Examination"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="widget-description">Description</Label>
                  <Textarea
                    id="widget-description"
                    value={widgetDescription}
                    onChange={(e) => setWidgetDescription(e.target.value)}
                    placeholder="Brief description of what this form captures"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-select">
                    Load Template (Optional)
                  </Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={handleLoadTemplate}
                  >
                    <SelectTrigger id="template-select">
                      <SelectValue placeholder="Select a template to start with" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEFAULT_TEMPLATES).map(
                        ([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {template.name}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Form Sections</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSection}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                {sections.map((section, sectionIndex) => (
                  <Card key={sectionIndex}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={section.title}
                            onChange={(e) =>
                              handleUpdateSection(sectionIndex, {
                                title: e.target.value,
                              })
                            }
                            placeholder="Section title"
                          />
                          <div className="flex items-center gap-4">
                            <Label className="text-sm">Grid Columns:</Label>
                            <Select
                              value={section.gridColumns?.toString() || "2"}
                              onValueChange={(value) =>
                                handleUpdateSection(sectionIndex, {
                                  gridColumns: parseInt(value) as 1 | 2 | 3,
                                })
                              }
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {sections.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveSection(sectionIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Fields */}
                      {section.fields.map((field, fieldIndex) => (
                        <div
                          key={fieldIndex}
                          className="p-4 border rounded-lg space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-sm">
                                Field {fieldIndex + 1}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveField(sectionIndex, fieldIndex)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Field ID</Label>
                              <Input
                                value={field.id}
                                onChange={(e) =>
                                  handleUpdateField(sectionIndex, fieldIndex, {
                                    id: e.target.value,
                                  })
                                }
                                placeholder="field_id"
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Label</Label>
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  handleUpdateField(sectionIndex, fieldIndex, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="Field Label"
                                className="text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) =>
                                  handleUpdateField(sectionIndex, fieldIndex, {
                                    type: value as FieldType,
                                  })
                                }
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FIELD_TYPES.map((type) => (
                                    <SelectItem
                                      key={type.value}
                                      value={type.value}
                                    >
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs">Placeholder</Label>
                              <Input
                                value={field.placeholder || ""}
                                onChange={(e) =>
                                  handleUpdateField(sectionIndex, fieldIndex, {
                                    placeholder: e.target.value,
                                  })
                                }
                                placeholder="Enter placeholder"
                                className="text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`required-${sectionIndex}-${fieldIndex}`}
                                checked={field.validation?.required || false}
                                onCheckedChange={(checked) =>
                                  handleUpdateField(sectionIndex, fieldIndex, {
                                    validation: {
                                      ...field.validation,
                                      required: checked as boolean,
                                    },
                                  })
                                }
                              />
                              <Label
                                htmlFor={`required-${sectionIndex}-${fieldIndex}`}
                                className="text-xs"
                              >
                                Required
                              </Label>
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddField(sectionIndex)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setWidgetName("");
                    setWidgetDescription("");
                    setSections([
                      {
                        id: "section_1",
                        title: "Main Section",
                        fields: [],
                        gridColumns: 2,
                      },
                    ]);
                    setSelectedTemplate("");
                  }}
                >
                  Reset
                </Button>
                <Button onClick={handleSaveWidget}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Custom Widget
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
