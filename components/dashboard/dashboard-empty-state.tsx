"use client";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Building2, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export function DashboardEmptyState() {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4 my-auto">
      <Empty className="border border-dashed max-w-4xl">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building2 className="h-8 w-8" />
          </EmptyMedia>
          <EmptyTitle className="text-2xl">Welcome to KumaClinic!</EmptyTitle>
          <EmptyDescription className="text-base">
            Get started by creating your clinic or joining an existing one. Once
            you're part of a clinic, you'll be able to manage appointments,
            patients, and team members all in one place.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="mt-8">
          <div className="grid gap-4 w-full sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-6 text-left space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <Plus className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Create a Clinic</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Set up your own clinic with custom settings, locations, and team
                members.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push("/register-clinic")}
              >
                Create Clinic
              </Button>
            </div>

            <div className="rounded-lg border bg-card p-6 text-left space-y-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Join a Clinic</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Wait for an invitation from a clinic administrator to join their
                team.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/dashboard/notifications")}
              >
                Check Invitations
              </Button>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-2">Quick Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 text-left">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Complete your profile in Settings to get started</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You can be a member of multiple clinics</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  Check notifications regularly for clinic invitations
                </span>
              </li>
            </ul>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
