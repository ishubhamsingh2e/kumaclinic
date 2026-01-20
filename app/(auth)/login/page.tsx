import { LoginForm } from "@/components/forms/auth/login-form";
import { Suspense } from "react";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  return (
    <div className="bg- flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <img
          src="/logo/light.png"
          alt="Kumasoft Logo"
          className="w-44 object-contain self-center"
        />
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
