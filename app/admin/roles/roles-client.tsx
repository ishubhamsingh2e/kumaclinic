"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { RoleSheet } from "@/components/admin/role-sheet";
import { MoreVertical, Pencil, Trash, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  _count: {
    users: number;
  };
}

interface RolesPageClientProps {
  initialRoles: Role[];
  allPermissions: Permission[];
}

export default function RolesPageClient({
  initialRoles,
  allPermissions,
}: RolesPageClientProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "edit">("create");
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | undefined>();
  const [transferToRoleId, setTransferToRoleId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenSheet = (mode: "create" | "edit", role?: Role) => {
    setSheetMode(mode);
    setSelectedRole(role);
    setSheetOpen(true);
  };

  const handleOpenDeleteDialog = (role: Role) => {
    setRoleToDelete(role);
    setTransferToRoleId("");
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    if (roleToDelete._count.users > 0 && !transferToRoleId) {
      toast.error("Please select a role to transfer users to");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId: roleToDelete.id,
          transferToRoleId: transferToRoleId || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete role");
      }

      toast.success(
        roleToDelete._count.users > 0
          ? `Role deleted and ${roleToDelete._count.users} user(s) transferred`
          : "Role deleted successfully"
      );
      setDeleteDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccess = () => {
    router.refresh();
  };

  const availableTransferRoles = initialRoles.filter(
    (r) => r.id !== roleToDelete?.id
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Total: {initialRoles.length} roles, {allPermissions.length}{" "}
            permissions
          </p>
        </div>
        <Button onClick={() => handleOpenSheet("create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialRoles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              initialRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{role._count.users}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {role.permissions.slice(0, 5).map((permission) => (
                        <Badge
                          key={permission.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {permission.name}
                        </Badge>
                      ))}
                      {role.permissions.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenSheet("edit", role)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(role)}
                          className="text-destructive"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Role
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RoleSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={sheetMode}
        role={selectedRole}
        allPermissions={allPermissions}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{roleToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {roleToDelete && roleToDelete._count.users > 0 && (
            <div className="py-4">
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  This role has {roleToDelete._count.users} user(s). You must
                  transfer them to another role before deletion.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-role">Transfer Users To</Label>
                <Select
                  value={transferToRoleId}
                  onValueChange={setTransferToRoleId}
                >
                  <SelectTrigger id="transfer-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTransferRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r._count.users} users)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
