"use client";

import { Button } from "@/components/ui/button";
import { AppleIcon, GoogleIcon } from "../icons";

export function ConnectedAccounts() {
  const providers = [
    {
      name: "Google",
      icon: GoogleIcon,
      description: "Connect your Google account to sync your calendar.",
      status: "Not connected",
    },
    {
      name: "Apple",
      icon: AppleIcon,
      description: "Sign in with Apple for faster access.",
      status: "Not connected",
    },
  ];

  return (
    <div className="grid gap-4">
      {providers.map((provider) => (
        <div
          key={provider.name}
          className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="bg-secondary flex h-10 w-10 items-center justify-center rounded-full">
              <provider.icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm leading-none font-medium">
                {provider.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {provider.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground hidden text-xs sm:inline">
              {provider.status}
            </span>
            <Button variant="outline" size="sm" disabled>
              Connect
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
