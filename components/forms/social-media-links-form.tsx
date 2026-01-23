"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  TwitterIcon,
} from "../icons";

const socialMediaSchema = z.object({
  instagram: z.string().url().optional().or(z.literal("")),
  facebook: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  linkedin: z.string().url().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof socialMediaSchema>;

interface SocialMediaLinksFormProps {
  clinic: Clinic;
}

const socialFields: {
  name: keyof FormValues;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  placeholder: string;
}[] = [
  {
    name: "instagram",
    label: "Instagram",
    icon: InstagramIcon,
    placeholder: "https://instagram.com/yourprofile",
  },
  {
    name: "facebook",
    label: "Facebook",
    icon: FacebookIcon,
    placeholder: "https://facebook.com/yourpage",
  },
  {
    name: "twitter",
    label: "Twitter/X",
    icon: TwitterIcon,
    placeholder: "https://twitter.com/yourprofile",
  },
  {
    name: "linkedin",
    label: "LinkedIn",
    icon: LinkedInIcon,
    placeholder: "https://linkedin.com/company/yourcompany",
  },
];

export function SocialMediaLinksForm({ clinic }: SocialMediaLinksFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(socialMediaSchema),
    defaultValues: {
      instagram: clinic.instagram || "",
      facebook: clinic.facebook || "",
      twitter: clinic.twitter || "",
      linkedin: clinic.linkedin || "",
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
      toast.success("Social media links updated successfully.");
    } else {
      toast.error(result.error || "Failed to update social media links.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Links</CardTitle>
        <CardDescription>
          Add your clinic's social media profiles to connect with patients.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {socialFields.map(({ name, label, icon: Icon, placeholder }) => (
            <Field key={name}>
              <FieldLabel className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
              </FieldLabel>
              <FieldContent>
                <Input
                  {...form.register(name)}
                  placeholder={placeholder}
                  type="url"
                />
              </FieldContent>
              {errors[name] && <FieldError>{errors[name]?.message}</FieldError>}
            </Field>
          ))}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Social Links"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
