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
import { Alert, AlertDescription, AlertTitle, WARNING_STYLE } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  userId: string;
  User: {
    id: string;
    name: string | null;
    email: string | null;
  };
  Role: {
    name: string;
  };
}

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  clinicName: string;
}

export function TransferOwnershipDialog({
  open,
  onOpenChange,
  members,
  clinicName,
}: TransferOwnershipDialogProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransfer = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/team/transfer-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newOwnerId: selectedUserId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to transfer ownership");
      }

      toast.success("Ownership transferred successfully");
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
          <DialogTitle>Transfer Ownership</DialogTitle>
          <DialogDescription>
            Transfer ownership of {clinicName} to another team member
          </DialogDescription>
        </DialogHeader>

        <Alert className={WARNING_STYLE}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            This action will transfer full ownership of the clinic. You will
            become a regular team member and lose owner privileges.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Owner</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    <div className="flex flex-col">
                      <span>{member.User.name || "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.User.email} - {member.Role.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button
            variant="destructive"
            onClick={handleTransfer}
            disabled={isSubmitting || !selectedUserId}
          >
            {isSubmitting ? "Transferring..." : "Transfer Ownership"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
