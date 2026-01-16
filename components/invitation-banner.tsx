"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Mail } from "lucide-react";
import { acceptInvitation } from "@/lib/actions/clinic";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function InvitationBanner({ invitations }: { invitations: any[] }) {
  const [items, setItems] = useState(invitations);
  const router = useRouter();
  const { update } = useSession();

  if (items.length === 0) return null;

  const handleAccept = async (id: string, clinicId: string) => {
    try {
      await acceptInvitation(id);
      toast.success("Joined clinic successfully");
      setItems(items.filter(i => i.id !== id));
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-2 mb-6">
      {items.map((inv) => (
        <Alert key={inv.id} className="flex items-center justify-between border-primary/50 bg-primary/5">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <AlertTitle>Invitation to join {inv.clinic.name}</AlertTitle>
              <AlertDescription>
                You have been invited as a {inv.role.name}.
              </AlertDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleAccept(inv.id, inv.clinicId)}>
              <Check className="mr-1 h-4 w-4" /> Accept
            </Button>
            <Button size="sm" variant="ghost">
              <X className="mr-1 h-4 w-4" /> Decline
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
