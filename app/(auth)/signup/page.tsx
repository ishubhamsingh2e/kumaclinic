import { SignupForm } from "@/components/forms/signup-form";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Sign Up - KumaCare",
  description: "ERP for Clinics and Hospitals",
};

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

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
        <SignupForm />
      </div>
    </div>
  );
}
