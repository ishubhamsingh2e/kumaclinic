"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  roleId: z.string().min(1, "Role is required"),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface Role {
  id: string;
  name: string;
  priority: number;
}

interface InviteUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
  currentUserRole?: Role;
}

export function InviteUserSheet({
  open,
  onOpenChange,
  roles,
  currentUserRole,
}: InviteUserSheetProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      roleId: "",
    },
  });

  // Filter roles based on hierarchy - can only invite roles with lower priority
  const availableRoles = roles.filter(
    (role) => !currentUserRole || role.priority < currentUserRole.priority,
  );

  const onSubmit = async (values: InviteFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      toast.success("Invitation sent successfully");
      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Invite User</SheetTitle>
          <SheetDescription>
            Send an invitation to join your clinic team
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 p-4 h-full flex flex-col justify-between"
        >
          <div className="space-y-4">
            <Field>
              <FieldLabel>Email Address</FieldLabel>
              <FieldContent>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  {...form.register("email")}
                />
              </FieldContent>
              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel>Role</FieldLabel>
              <FieldContent>
                <Select
                  value={form.watch("roleId")}
                  onValueChange={(value) => form.setValue("roleId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldContent>
              {form.formState.errors.roleId && (
                <FieldError>{form.formState.errors.roleId.message}</FieldError>
              )}
              {currentUserRole && (
                <p className="text-xs text-muted-foreground mt-1">
                  You can only invite users with roles lower than your role
                </p>
              )}
            </Field>
          </div>

          <SheetFooter className="grid grid-cols-2 gap-4 p-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Invitation"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
