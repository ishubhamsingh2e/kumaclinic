"use client";

import { forwardRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RiCalendarLine } from "@remixicon/react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Gender, MaritalStatus, BloodGroup } from "@prisma/client";

const PatientRegistrationSchema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  name: z.string().min(1, "Name is required"),
  gender: z.nativeEnum(Gender),
  dob: z.date(),
  is_dob_estimate: z.boolean(),
  city: z.string().optional(),
  address: z.string().optional(),
  marital_status: z.nativeEnum(MaritalStatus).optional(),
  blood_group: z.nativeEnum(BloodGroup).optional(),
  spouse_name: z.string().optional(),
  referred_by: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  how_did_you_hear_about_us: z.string().optional(),
  care_of: z.string().optional(),
  occupation: z.string().optional(),
  tag: z.string().optional(),
  alternative_phone: z.string().optional(),
  aadhar_number: z.string().optional(),
});

type PatientRegistrationData = z.infer<typeof PatientRegistrationSchema>;

const PatientRegistrationForm = forwardRef<HTMLFormElement>((props, ref) => {
  const router = useRouter();
  const [existingPatients, setExistingPatients] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPatientsList, setShowPatientsList] = useState(false);

  const form = useForm<PatientRegistrationData>({
    resolver: zodResolver(PatientRegistrationSchema),
    defaultValues: {
      gender: Gender.MALE,
      is_dob_estimate: false,
      phone: "",
      name: "",
      city: "",
      address: "",
      spouse_name: "",
      referred_by: "",
      email: "",
      how_did_you_hear_about_us: "",
      care_of: "",
      occupation: "",
      tag: "",
      alternative_phone: "",
      aadhar_number: "",
    },
  });

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
    reset,
    watch,
  } = form;
  const phoneValue = watch("phone");

  useEffect(() => {
    const searchPatients = async () => {
      if (phoneValue && phoneValue.length >= 10) {
        setIsSearching(true);
        try {
          const response = await fetch(
            `/api/patients/search?phone=${phoneValue}`,
          );
          const data = await response.json();
          if (data.patients && data.patients.length > 0) {
            setExistingPatients(data.patients);
            setShowPatientsList(true);
          } else {
            setExistingPatients([]);
            setShowPatientsList(false);
          }
        } catch (error) {
          console.error("Error searching patients:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setExistingPatients([]);
        setShowPatientsList(false);
      }
    };

    const timer = setTimeout(searchPatients, 500);
    return () => clearTimeout(timer);
  }, [phoneValue]);

  const onSubmit = async (data: PatientRegistrationData) => {
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register patient");
      }

      const patient = await response.json();
      toast.success("Patient registered successfully");
      reset();
    } catch (error: any) {
      toast.error(error.message || "An error occurred during registration.");
      console.error(error);
    }
  };

  const onSubmitAndBook = async (data: PatientRegistrationData) => {
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to register patient");
      }

      const patient = await response.json();
      toast.success("Patient registered successfully");
      router.push(`/dashboard/appointments/new/${patient.id}`);
    } catch (error: any) {
      toast.error(error.message || "An error occurred during registration.");
      console.error(error);
    }
  };

  return (
    <form ref={ref} onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Required fields */}
          <Controller
            control={control}
            name="phone"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>
                  Phone Number <span className="text-red-500">*</span>
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    {...field}
                    placeholder="Enter phone number"
                  />
                  <Popover
                    open={showPatientsList}
                    onOpenChange={setShowPatientsList}
                  >
                    <PopoverTrigger asChild>
                      <InputGroupAddon
                        align="inline-end"
                        className="cursor-pointer"
                      >
                        {isSearching ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : existingPatients.length > 0 ? (
                          <div className="relative">
                            <Users className="h-4 w-4" />
                            <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-[8px] text-white">
                              {existingPatients.length}
                            </span>
                          </div>
                        ) : null}
                      </InputGroupAddon>
                    </PopoverTrigger>
                    {existingPatients.length > 0 && (
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">
                            Existing Patients with this number:
                          </h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {existingPatients.map((patient) => (
                              <div
                                key={patient.id}
                                className="p-3 rounded border hover:bg-accent"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="font-medium">
                                      {patient.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {patient.gender} •{" "}
                                      {format(new Date(patient.dob), "PP")}
                                    </div>
                                    {patient.city && (
                                      <div className="text-sm text-muted-foreground">
                                        {patient.city}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setShowPatientsList(false);
                                      router.push(
                                        `/dashboard/appointments/new/${patient.id}`,
                                      );
                                    }}
                                  >
                                    Book
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    )}
                  </Popover>
                </InputGroup>
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>
                  Name <span className="text-red-500">*</span>
                </FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="gender"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>
                  Gender <span className="text-red-500">*</span>
                </FieldLabel>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex gap-4 w-fit"
                >
                  {Object.values(Gender).map((g) => (
                    <Field orientation="horizontal" key={g}>
                      <RadioGroupItem value={g} id={"gender-" + g} />
                      <FieldLabel
                        htmlFor={"gender-" + g}
                        className="font-normal capitalize"
                      >
                        {g.toLowerCase()}
                      </FieldLabel>
                    </Field>
                  ))}
                </RadioGroup>
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="dob"
            render={({ field, fieldState: { error } }) => (
              <Field className="flex flex-col">
                <FieldLabel>
                  Date of Birth <span className="text-red-500">*</span>
                </FieldLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-between text-left font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <RiCalendarLine className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="alternative_phone"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Alternative Phone</FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="marital_status"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Marital Status</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MaritalStatus).map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="spouse_name"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Spouse Name</FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="blood_group"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Blood Group</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(BloodGroup).map((bg) => (
                      <SelectItem key={bg} value={bg}>
                        {bg.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="care_of"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>C/O</FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="occupation"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Occupation</FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="aadhar_number"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Aadhar Number</FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="city"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>City</FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Address</FieldLabel>
                <Textarea {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="referred_by"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Referred By</FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="how_did_you_hear_about_us"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>How did you hear about us?</FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="tag"
            render={({ field, fieldState: { error } }) => (
              <Field>
                <FieldLabel>Tag</FieldLabel>
                <Input {...field} />
                {error && <FieldError>{error.message}</FieldError>}
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register Patient"}
        </Button>
        <Button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit(onSubmitAndBook)}
        >
          {isSubmitting ? "Registering..." : "Register & Book Appointment"}
        </Button>
      </div>
    </form>
  );
});

PatientRegistrationForm.displayName = "PatientRegistrationForm";

export { PatientRegistrationForm };
