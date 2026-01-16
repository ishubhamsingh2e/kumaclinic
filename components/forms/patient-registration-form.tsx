"use client";

import { useActionState } from "react";
import { registerPatient } from "@/lib/actions/patient";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import {
  Gender,
  MaritalStatus,
  BloodGroup,
} from "@/lib/generated/prisma/enums";
import { Separator } from "@/components/ui/separator";
import { FileUpload } from "@/components/ui/file-upload";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormStatus } from "react-dom";
import { Card, CardContent } from "../ui/card";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Label } from "../ui/label";
import { NumberInput } from "../ui/number-input";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending ? "Registering..." : "Register Patient"}
    </Button>
  );
}

export function PatientRegistrationForm() {
  const initialState = { message: "", type: "", errors: {} };
  const [state, dispatch] = useActionState(registerPatient, initialState);
  const [dobType, setDobType] = useState<"date" | "age">("date");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dob, setDob] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!state.message) return;
    if (state.type === "success") {
      toast.success(state.message);
    } else if (state.type === "error") {
      toast.error(state.message);
    }
  }, [state]);

  const age = useMemo(() => {
    if (!dob) return { years: "", months: "", days: "" };
    const birthDate = new Date(`${dob}T00:00:00`);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return {
      years: years > 0 ? String(years) : "0",
      months: months > 0 ? String(months) : "0",
      days: days > 0 ? String(days) : "0",
    };
  }, [dob]);

  const handleAgeChange = (
    part: "years" | "months" | "days",
    value: string,
  ) => {
    const newAge = { ...age, [part]: value };
    const { years, months, days } = newAge;
    if (years || months || days) {
      const today = new Date();
      const y = parseInt(years, 10) || 0;
      const m = parseInt(months, 10) || 0;
      const d = parseInt(days, 10) || 0;

      today.setFullYear(today.getFullYear() - y);
      today.setMonth(today.getMonth() - m);
      today.setDate(today.getDate() - d);

      setDob(today.toLocaleDateString("sv-SE"));
    } else {
      setDob("");
    }
  };

  const tagOptions = [
    { label: "New Patient", value: "new-patient" },
    { label: "Follow-up", value: "follow-up" },
    { label: "VIP", value: "vip" },
    { label: "High Risk", value: "high-risk" },
    { label: "Allergy Alert", value: "allergy-alert" },
  ];

  return (
    <form action={dispatch}>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4">
        <div className="col-span-2">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Patient Information</h1>
            <p className="text-muted-foreground text-sm">
              Fill in the form below to register a new patient.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-6">
            {/* Personal Information */}
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </FieldLabel>
                <Input id="phone" name="phone" type="tel" required />
                {state.errors?.phone && (
                  <FieldDescription className="text-red-500">
                    {state.errors.phone}
                  </FieldDescription>
                )}
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="name">
                  Patient Name <span className="text-red-500">*</span>
                </FieldLabel>
                <Input id="name" name="name" required />
                {state.errors?.name && (
                  <FieldDescription className="text-red-500">
                    {state.errors.name}
                  </FieldDescription>
                )}
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="gender">
                  Gender <span className="text-red-500">*</span>
                </FieldLabel>
                <RadioGroup name="gender" required className="flex space-x-2">
                  {Object.values(Gender).map((g) => (
                    <div key={g} className="flex items-center space-x-2">
                      <RadioGroupItem value={g} id={g} />
                      <Label htmlFor={g}>{g}</Label>
                    </div>
                  ))}
                </RadioGroup>
                {state.errors?.gender && (
                  <FieldDescription className="text-red-500">
                    {state.errors.gender}
                  </FieldDescription>
                )}
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel>
                  Date of Birth <span className="text-red-500">*</span>
                </FieldLabel>{" "}
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <Select
                    name="dob_type"
                    onValueChange={(value) =>
                      setDobType(value as "date" | "age")
                    }
                    defaultValue="date"
                  >
                    <SelectTrigger className="w-full sm:w-1/4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="age">Age</SelectItem>
                    </SelectContent>
                  </Select>
                  {dobType === "date" ? (
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date"
                          className="flex-1 justify-between font-normal"
                        >
                          {dob
                            ? new Date(`${dob}T00:00:00`).toLocaleDateString()
                            : "Select date"}
                          <ChevronDownIcon />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          defaultMonth={
                            dob ? new Date(`${dob}T00:00:00`) : undefined
                          }
                          selected={
                            dob ? new Date(`${dob}T00:00:00`) : undefined
                          }
                          onSelect={(e) =>
                            setDob(e ? e.toLocaleDateString("sv-SE") : "")
                          }
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="flex flex-1 gap-2">
                      <NumberInput
                        id="dob_years"
                        name="dob_years"
                        placeholder="Years"
                        className="flex-1"
                        value={age.years === "" ? null : Number(age.years)}
                        onChange={(e) =>
                          handleAgeChange("years", e?.toString() ?? "")
                        }
                      />
                      <NumberInput
                        id="dob_months"
                        name="dob_months"
                        placeholder="Months"
                        className="flex-1"
                        value={age.months === "" ? null : Number(age.months)}
                        onChange={(e) =>
                          handleAgeChange("months", e?.toString() ?? "")
                        }
                      />
                      <NumberInput
                        id="dob_days"
                        name="dob_days"
                        placeholder="Days"
                        className="flex-1"
                        value={age.days === "" ? null : Number(age.days)}
                        onChange={(e) =>
                          handleAgeChange("days", e?.toString() ?? "")
                        }
                      />
                    </div>
                  )}
                </div>
                {state.errors?.dob && (
                  <FieldDescription className="text-red-500">
                    {state.errors.dob}
                  </FieldDescription>
                )}
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="marital_status">Marital Status</FieldLabel>
                <Select name="marital_status">
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MaritalStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="when_field">When Field</FieldLabel>
                <Input id="when_field" name="when_field" />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="care_of">C/O (Care Of)</FieldLabel>
                <Input id="care_of" name="care_of" />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="occupation">Occupation</FieldLabel>
                <Input id="occupation" name="occupation" />
              </Field>
            </div>
            <div className="col-span-full my-4 flex items-center gap-2">
              <h4 className="text-md text-primary col-span-full font-semibold break-keep">
                Contact Information
              </h4>
              <Separator className="flex-1" />
            </div>
            {/* Contact Information */}
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="alternative_phone">
                  Alternative Phone Number
                </FieldLabel>
                <Input
                  id="alternative_phone"
                  name="alternative_phone"
                  type="tel"
                />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" name="email" type="email" />
                {state.errors?.email && (
                  <FieldDescription className="text-red-500">
                    {state.errors.email}
                  </FieldDescription>
                )}
              </Field>
            </div>
            <div className="col-span-full">
              <Field className="gap-2">
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <Input id="address" name="address" />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input id="city" name="city" />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="pin_code">Pin Code</FieldLabel>
                <Input id="pin_code" name="pin_code" />
              </Field>
            </div>
            <div className="col-span-full my-4 flex items-center gap-2">
              <h4 className="text-md text-primary col-span-full font-semibold break-keep">
                Medial Information
              </h4>
              <Separator className="flex-1" />
            </div>
            {/* Medical Information */}
            <div className="col-span-full sm:col-span-2">
              <Field className="gap-2">
                <FieldLabel htmlFor="blood_group">Blood Group</FieldLabel>
                <Select name="blood_group">
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(BloodGroup).map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="col-span-full sm:col-span-2">
              <Field className="gap-2">
                <FieldLabel htmlFor="spouse_name">Spouse Name</FieldLabel>
                <Input id="spouse_name" name="spouse_name" />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-2">
              <Field className="gap-2">
                <FieldLabel htmlFor="spouse_blood_group">
                  Spouse Blood Group
                </FieldLabel>
                <Select name="spouse_blood_group">
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(BloodGroup).map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="col-span-full my-4 flex items-center gap-2">
              <h4 className="text-md text-primary col-span-full font-semibold break-keep">
                Other Information
              </h4>
              <Separator className="flex-1" />
            </div>
            {/* Other Information */}
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="how_did_you_hear_about_us">
                  How Did You Hear About Us?
                </FieldLabel>
                <Input
                  id="how_did_you_hear_about_us"
                  name="how_did_you_hear_about_us"
                />
              </Field>
            </div>
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="aadhar_number">Aadhar Number</FieldLabel>
                <Input id="aadhar_number" name="aadhar_number" />
                {state.errors?.aadhar_number && (
                  <FieldDescription className="text-red-500">
                    {state.errors.aadhar_number}
                  </FieldDescription>
                )}
              </Field>
            </div>
          </div>
        </div>

        <Card className="sticky top-0 h-fit self-start">
          <CardContent className="grid grid-cols-1 gap-2">
            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="tags">Tags</FieldLabel>

                <MultiSelect>
                  <MultiSelectTrigger className="w-full">
                    <MultiSelectValue
                      overflowBehavior="wrap"
                      placeholder="Tag Patient"
                    />
                  </MultiSelectTrigger>

                  <MultiSelectContent>
                    <MultiSelectGroup>
                      {tagOptions.map((option) => (
                        <MultiSelectItem
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </MultiSelectItem>
                      ))}
                    </MultiSelectGroup>
                  </MultiSelectContent>
                </MultiSelect>
              </Field>
            </div>

            <div className="col-span-full sm:col-span-3">
              <Field className="gap-2">
                <FieldLabel htmlFor="referred_by">Referred By</FieldLabel>

                <Input id="referred_by" name="referred_by" />
              </Field>
            </div>

            <div className="col-span-full">
              <Field className="gap-2">
                <FieldLabel className="hidden">Attachments</FieldLabel>
                <div className="space-y-2">
                  <FileUpload
                    label="Documents/Images"
                    name="attachments"
                    acceptedFileTypes="image/png, image/jpeg, image/webp, .pdf,.doc,.docx"
                    multiple
                  />
                </div>
              </Field>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <SubmitButton />
      </div>
    </form>
  );
}
