"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function NotificationSettings() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Manage your email and SMS preferences.
      </p>
      <div className="pointer-events-none space-y-4 opacity-50">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Newsletter</Label>
            <p className="text-muted-foreground text-xs">
              Receive updates about new features and clinics.
            </p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Appointment Reminders</Label>
            <p className="text-muted-foreground text-xs">
              Get notified about your upcoming appointments.
            </p>
          </div>
          <Switch />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Security Alerts</Label>
            <p className="text-muted-foreground text-xs">
              Important notifications about your account security.
            </p>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  );
}
