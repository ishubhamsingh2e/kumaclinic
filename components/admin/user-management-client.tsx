"use client";

import {
  Shield,
  Mail,
  Users as UsersIcon,
  UserPlus,
  Settings,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  createClinicUser,
  deleteClinicUser,
  updateClinicUserRole,
} from "@/lib/actions/user";
import { inviteUserToClinic, cancelInvitation, transferClinicOwnership } from "@/lib/actions/clinic";
import { Role } from "@/lib/generated/prisma/client";
import { useState } from "react";
import { useSession } from "next-auth/react";

type DisplayUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: (Role & { permissions: { name: string }[] }) | null;
  roleId: string | null;
  status: "ACTIVE" | "PENDING";
};

export function UserManagementClient({
  users,
  roles,
  invitations,
  ownerId,
}: {
  users: DisplayUser[];
  roles: Role[];
  invitations: DisplayUser[];
  ownerId: string | null;
}) {
  const { data: session } = useSession();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [manageUser, setManageUser] = useState<DisplayUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToTransfer, setUserToTransfer] = useState<DisplayUser | null>(null);

  const allItems = [...users, ...invitations];

  async function handleInviteUser(formData: FormData) {
    const email = formData.get("email") as string;
    const roleId = formData.get("roleId") as string;

    try {
      await inviteUserToClinic(email, roleId);
      toast.success("Invitation sent successfully");
      setIsInviteOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;

    // Find the item to check its status
    const item = allItems.find((i) => i.id === userToDelete);
    if (!item) return;

    let res;
    if (item.status === "ACTIVE") {
      res = await deleteClinicUser(userToDelete);
    } else {
      res = await cancelInvitation(userToDelete);
    }

    if (res.type === "success") {
      toast.success(res.message);
      setUserToDelete(null);
      setManageUser(null); // Close the manage dialog if open
    } else {
      toast.error(res.message);
    }
  }

  async function handleRoleChange(userId: string, roleId: string) {
    const res = await updateClinicUserRole(userId, roleId);

    if (res.type === "success") {
      toast.success(res.message);
      // Optimistically update the local state or let revalidatePath handle it
      // For now, we rely on the server action revalidating the path
      if (manageUser && manageUser.id === userId) {
         // Close dialog to refresh or we could try to update local state if we had it fully controlled
         setManageUser(null);
      }
    } else {
      toast.error(res.message);
    }
  }

  async function handleTransferOwnership() {
    if (!userToTransfer) return;

    const res = await transferClinicOwnership(userToTransfer.id);

    if (res.type === "success") {
      toast.success(res.message);
      setUserToTransfer(null);
      setManageUser(null);
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invitations
            </CardTitle>
            <Mail className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Roles
            </CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Header & Invite Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">User Management</h2>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to join your clinic.
              </DialogDescription>
            </DialogHeader>
            <form action={handleInviteUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="colleague@clinic.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Assign Role</Label>
                <Select name="roleId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit">Send Invitation</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
              <Avatar className="h-12 w-12 rounded-lg border">
                <AvatarImage src={item.image || ""} alt={item.name || ""} className="rounded-lg" />
                <AvatarFallback className="rounded-lg">
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1 overflow-hidden">
                <div className="flex items-center gap-2 overflow-hidden">
                  <h3 className="font-semibold leading-none truncate" title={item.name || "N/A"}>
                    {item.name || "N/A"}
                  </h3>
                  {item.id === ownerId && (
                    <Badge variant="secondary" className="h-4 text-[10px] px-1 bg-yellow-100 text-yellow-800 border-yellow-200">Owner</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm truncate" title={item.email || ""}>
                  {item.email}
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>
                  {item.status}
                </Badge>
                {item.role && (
                   <Badge variant="outline" className="font-normal">
                      {item.role.name}
                   </Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-4">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setManageUser(item)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage Access
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Manage User Dialog */}
      <Dialog open={!!manageUser} onOpenChange={(open) => !open && setManageUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Access</DialogTitle>
            <DialogDescription>
              Update role and permissions for this user.
            </DialogDescription>
          </DialogHeader>

          {manageUser && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-lg border">
                  <AvatarImage src={manageUser.image || ""} className="rounded-lg" />
                  <AvatarFallback className="rounded-lg">
                     <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{manageUser.name || "N/A"}</h4>
                    {manageUser.id === ownerId && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Owner</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{manageUser.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                {manageUser.status === "ACTIVE" ? (
                  <Select
                    defaultValue={manageUser.roleId || undefined}
                    onValueChange={(val) => handleRoleChange(manageUser.id, val)}
                    disabled={manageUser.id === ownerId || manageUser.id === session?.user?.id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                   <div className="border rounded-md px-3 py-2 text-sm text-muted-foreground bg-muted/50">
                      Role changes only available for active users. Re-invite to change role.
                   </div>
                )}
                {(manageUser.id === ownerId || manageUser.id === session?.user?.id) && (
                  <p className="text-[10px] text-muted-foreground">
                    Fail-safe: Role cannot be changed for the owner or yourself.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-md border bg-muted/20 min-h-[60px]">
                  {manageUser.role?.permissions?.length ? (
                    manageUser.role.permissions.map((p) => (
                      <Badge key={p.name} variant="secondary" className="text-xs">
                         {p.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm italic">No specific permissions</span>
                  )}
                </div>
              </div>
              
              <div className="grid gap-2">
                 {session?.user?.id === ownerId && manageUser.id !== ownerId && manageUser.status === "ACTIVE" && (
                    <Button 
                      variant="outline" 
                      className="w-full border-yellow-200 hover:bg-yellow-50 text-yellow-700"
                      onClick={() => setUserToTransfer(manageUser)}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Transfer Clinic Ownership
                    </Button>
                 )}
                 
                 <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setUserToDelete(manageUser.id)}
                    disabled={manageUser.id === ownerId || manageUser.id === session?.user?.id}
                 >
                    {manageUser.status === "ACTIVE" ? "Remove User from Clinic" : "Cancel Invitation"}
                 </Button>
                 
                 {(manageUser.id === ownerId || manageUser.id === session?.user?.id) && (
                    <p className="text-center text-[10px] text-muted-foreground">
                      Fail-safe: Owner or self cannot be removed.
                    </p>
                 )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Alert */}
      <AlertDialog
        open={!!userToTransfer}
        onOpenChange={(open) => !open && setUserToTransfer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer Clinic Ownership?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to transfer ownership to <strong>{userToTransfer?.name || userToTransfer?.email}</strong>?
              You will lose administrative control over the clinic and will no longer be able to manage this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransferOwnership}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Transfer Ownership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently remove the user's access to this clinic or cancel
              the pending invitation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
