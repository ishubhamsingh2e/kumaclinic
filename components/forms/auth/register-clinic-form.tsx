"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  RegisterClinicSchema,
  RegisterClinicData,
} from "@/lib/schemas/auth";

export function RegisterClinicForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterClinicData>({
    resolver: zodResolver(RegisterClinicSchema),
  });

  const onSubmit = async (data: RegisterClinicData) => {
    try {
      const res = await fetch("/api/auth/register-clinic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Clinic registered successfully! Please login to continue.");
        router.push("/login?registered=true");
      } else {
        const errorData = await res.json();
        if (res.status === 409) {
          toast.error("This email is already registered. Please use a different email or login.");
        } else {
          toast.error(errorData.message || "Failed to register clinic. Please try again.");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-semibold">
            Register your Clinic
          </CardTitle>
          <CardDescription>
            Create a new clinic and admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel>Clinic Name</FieldLabel>
                <Input
                  placeholder="KumaCare Clinic"
                  {...register("clinicName")}
                />
                {errors.clinicName && (
                  <FieldError>{errors.clinicName.message}</FieldError>
                )}
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                <div className="md:col-span-2">
                  <Controller
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel>Title</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="title" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mr.">Mr.</SelectItem>
                            <SelectItem value="Ms.">Ms.</SelectItem>
                            <SelectItem value="Mrs.">Mrs.</SelectItem>
                            <SelectItem value="Dr.">Dr.</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.title && (
                          <FieldError>{errors.title.message}</FieldError>
                        )}
                      </Field>
                    )}
                  />
                </div>
                <div className="md:col-span-4">
                  <Field>
                    <FieldLabel>Admin Name</FieldLabel>
                    <Input
                      placeholder="Dr. John Doe"
                      {...register("userName")}
                    />
                    {errors.userName && (
                      <FieldError>{errors.userName.message}</FieldError>
                    )}
                  </Field>
                </div>
              </div>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  placeholder="admin@clinic.com"
                  {...register("email")}
                />
                {errors.email && (
                  <FieldError>{errors.email.message}</FieldError>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...register("password")}
                  />
                  {errors.password && (
                    <FieldError>{errors.password.message}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <FieldError>
                      {errors.confirmPassword.message}
                    </FieldError>
                  )}
                </Field>
              </div>
              <FieldDescription>
                Must be at least 6 characters long.
              </FieldDescription>

              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Register Clinic"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="underline">
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our{" "}
        <Link href="#" className="underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="#" className="underline">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  );
}
