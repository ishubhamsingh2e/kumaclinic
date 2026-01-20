"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clinic } from "@prisma/client";
import { updateClinicProfile } from "@/lib/actions/clinic";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

const clinicProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  bio: z.string().optional(),
  googleReviewsUrl: z.string().url().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof clinicProfileSchema>;

interface ClinicProfileFormProps {
  clinic: Clinic;
}

const formFields: {
  name: keyof FormValues;
  label: string;
  component: typeof Input | typeof Textarea;
}[] = [
  { name: "name", label: "Clinic Name", component: Input },
  { name: "email", label: "Contact Email", component: Input },
  { name: "phone", label: "Phone Number", component: Input },
  { name: "whatsapp", label: "WhatsApp Number", component: Input },
  { name: "bio", label: "Bio", component: Textarea },
  { name: "googleReviewsUrl", label: "Google Reviews URL", component: Input },
];

export function ClinicProfileForm({ clinic }: ClinicProfileFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(clinicProfileSchema),
    defaultValues: {
      name: clinic.name || "",
      email: clinic.email || "",
      phone: clinic.phone || "",
      whatsapp: clinic.whatsapp || "",
      bio: clinic.bio || "",
      googleReviewsUrl: clinic.googleReviewsUrl || "",
    },
  });

  const {
    formState: { isSubmitting, errors },
  } = form;

  const onSubmit = async (values: FormValues) => {
    const result = await updateClinicProfile({
      id: clinic.id,
      ...values,
    });
    if (result.success) {
      toast.success("Clinic profile updated successfully.");
    } else {
      toast.error(result.error || "Failed to update profile.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinic Profile</CardTitle>
        <CardDescription>
          Update your clinic's public profile information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {formFields.map(({ name, label, component: Component }) => (
            <Field key={name}>
              <FieldLabel>{label}</FieldLabel>
              <FieldContent>
                <Component {...form.register(name)} />
              </FieldContent>
              {errors[name] && <FieldError>{errors[name]?.message}</FieldError>}
            </Field>
          ))}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
