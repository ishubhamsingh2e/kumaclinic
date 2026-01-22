"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
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

interface Invitation {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  inviterId: string;
  Role: {
    id: string;
    name: string;
  };
}

interface InvitationsTableProps {
  invitations: Invitation[];
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCancel = async (invitationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/team/invitation", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel invitation");
      }

      toast.success("Invitation cancelled");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
      setCancellingId(null);
    }
  };

  const isExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No pending invitations
                </TableCell>
              </TableRow>
            ) : (
              invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">
                    {invitation.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{invitation.Role.name}</Badge>
                  </TableCell>
                  <TableCell>
                    Invited
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                      </span>
                      {isExpired(invitation.expiresAt) && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setCancellingId(invitation.id)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!cancellingId}
        onOpenChange={(open) => !open && setCancellingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the pending invitation. The user will no longer be
              able to accept it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancellingId && handleCancel(cancellingId)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
