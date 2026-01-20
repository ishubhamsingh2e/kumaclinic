"use client";

import { useInitializeClinicData } from "@/store";
import { Provider as JotaiProvider } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "./ui/sonner";

function JotaiInitializer() {
  useInitializeClinicData();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NuqsAdapter>
      <JotaiProvider>
        <SessionProvider>
          <JotaiInitializer />
          {children}
          <Toaster />
        </SessionProvider>
      </JotaiProvider>
    </NuqsAdapter>
  );
}
