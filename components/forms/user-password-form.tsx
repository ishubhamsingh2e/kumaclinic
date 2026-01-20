"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const initialState = {
  message: "",
  type: "",
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Updating..." : "Update Password"}
    </Button>
  );
}

export function UserPasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (state?.type === "success") {
      toast.success(state.message);
      // Reset form on success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else if (state?.type === "error") {
      toast.error(state.message);
    }
  }, [state]);

  const isValidLength = newPassword.length >= 6;
  const isMatching = newPassword === confirmPassword && confirmPassword !== "";
  const hasCurrent = currentPassword.length > 0;

  const isValid = isValidLength && isMatching && hasCurrent;

  return (
    <form action={formAction}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1",
                isValidLength ? "text-green-500" : "text-muted-foreground",
              )}
            >
              {isValidLength ? (
                <Check className="h-3 w-3" />
              ) : (
                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              )}
              At least 6 characters
            </span>
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />
          {confirmPassword.length > 0 && (
            <div className="text-xs flex items-center gap-1">
              {isMatching ? (
                <span className="text-green-500 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Passwords match
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" /> Passwords do not match
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <SubmitButton disabled={!isValid} />
        </div>
      </div>
    </form>
  );
}
function updatePassword(state: {
  message: string;
  type: string;
}):
  | { message: string; type: string }
  | Promise<{ message: string; type: string }> {
  throw new Error("Function not implemented.");
}
