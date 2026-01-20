import { z } from "zod";

export const LoginSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export type LoginData = z.infer<typeof LoginSchema>;

export const RegisterClinicSchema = z
  .object({
    clinicName: z.string().min(1, { message: "Clinic name is required" }),
    title: z.string().min(1, { message: "Title is required" }),
    userName: z.string().min(1, { message: "Admin name is required" }),
    email: z.email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterClinicData = z.infer<typeof RegisterClinicSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
});

export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;

export const SignupSchema = z
  .object({
    title: z.string().min(1, { message: "Title is required" }),
    name: z.string().min(1, { message: "Full name is required" }),
    email: z.email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupData = z.infer<typeof SignupSchema>;
