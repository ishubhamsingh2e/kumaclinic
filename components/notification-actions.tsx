"use client";

import { Button } from "@/components/ui/button";
import { acceptInvitation, declineInvitation } from "@/lib/actions/clinic";
import { useSession } from "next-auth/react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Notification } from "@prisma/client";

export function NotificationActions({
  notification,
  canAction,
}: {
  notification: Notification;
  canAction: boolean;
}) {
  const { update } = useSession();
  const [isAccepting, startAcceptTransition] = useTransition();
  const [isDeclining, startDeclineTransition] = useTransition();

  const handleAccept = () => {
    startAcceptTransition(async () => {
      try {
        const result = await acceptInvitation(notification.referenceId || "");
        if (result.success) {
          toast.success("Invitation accepted!");
          await update({ activeClinicId: result.clinicId });
        } else {
          toast.error("Failed to accept invitation.");
        }
      } catch (error) {
        toast.error("An error occurred while accepting the invitation.");
      }
    });
  };

  const handleDecline = () => {
    startDeclineTransition(async () => {
      try {
        const result = await declineInvitation(notification.referenceId || "");
        if (result.success) {
          toast.success("Invitation declined.");
          await update();
        } else {
          toast.error("Failed to decline invitation.");
        }
      } catch (error) {
        toast.error("An error occurred while declining the invitation.");
      }
    });
  };

  if (canAction) {
    return (
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          onClick={handleAccept}
          disabled={isAccepting || isDeclining}
        >
          {isAccepting ? "Accepting..." : "Accept"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecline}
          disabled={isAccepting || isDeclining}
        >
          {isDeclining ? "Declining..." : "Decline"}
        </Button>
      </div>
    );
  }

  return null;
}
