import { RegisterClinicForm } from "@/components/forms/auth/register-clinic-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register Clinic - KumaCare",
  description: "Register your clinic on KumaCare",
};

export default async function RegisterClinicPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <img
            src="/logo/light.png"
            alt="Kumasoft Logo"
            className="w-44 object-contain"
          />
        </a>
        <RegisterClinicForm />
      </div>
    </div>
  );
}
