"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Member {
  id: string;
  userId: string;
  User: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
}: RemoveMemberDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRemove = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/team/remove-member", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          membershipId: member.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }

      toast.success("Member removed successfully");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{" "}
            <strong>{member.User.name || member.User.email}</strong> from your
            clinic team? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} disabled={isSubmitting}>
            {isSubmitting ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
