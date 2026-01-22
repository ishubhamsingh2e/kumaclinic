"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  priority: number;
}

interface Member {
  id: string;
  userId: string;
  roleId: string;
  User: {
    id: string;
    name: string | null;
    email: string | null;
  };
  Role: Role;
}

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
  roles: Role[];
  currentUserRole?: Role;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  member,
  roles,
  currentUserRole,
}: EditRoleDialogProps) {
  const router = useRouter();
  const [selectedRoleId, setSelectedRoleId] = useState(member.roleId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter roles - can only assign roles with equal or lower priority than current user
  const availableRoles = roles.filter(
    (role) => !currentUserRole || role.priority <= currentUserRole.priority
  );

  const handleSubmit = async () => {
    if (selectedRoleId === member.roleId) {
      toast.info("No changes made");
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/team/change-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: member.id,
          newRoleId: selectedRoleId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change role");
      }

      toast.success("Role updated successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Role</DialogTitle>
          <DialogDescription>
            Update the role for {member.User.name || member.User.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className="text-sm font-medium">{member.Role.name}</div>
          </div>

          <div className="space-y-2">
            <Label>New Role</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentUserRole && (
              <p className="text-xs text-muted-foreground">
                You can only assign roles equal to or lower than your role
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
