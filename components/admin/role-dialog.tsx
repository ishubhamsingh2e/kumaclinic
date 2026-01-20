"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

interface Permission {
  id: string;
  name: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface RoleDialogProps {
  mode: "create" | "edit";
  role?: Role;
  allPermissions: Permission[];
  trigger?: React.ReactNode;
}

export function RoleDialog({
  mode,
  role,
  allPermissions,
  trigger,
}: RoleDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roleName, setRoleName] = useState(role?.name || "");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions.map((p) => p.id) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = "/api/admin/roles";
      const method = mode === "create" ? "POST" : "PATCH";
      const body = JSON.stringify(
        mode === "create"
          ? { name: roleName, permissionIds: selectedPermissions }
          : { roleId: role?.id, permissionIds: selectedPermissions }
      );

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save role");
      }

      toast.success(data.message);
      setOpen(false);
      router.refresh();

      // Reset form
      if (mode === "create") {
        setRoleName("");
        setSelectedPermissions([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save role");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size={mode === "create" ? "default" : "sm"}>
            {mode === "create" ? (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Role" : "Edit Role"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new role and assign permissions"
              : "Update role permissions"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === "create" && (
            <div className="space-y-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g., CLINIC_MANAGER"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value.toUpperCase())}
                required
              />
              <p className="text-xs text-muted-foreground">
                Role name should be in UPPERCASE with underscores
              </p>
            </div>
          )}

          {mode === "edit" && (
            <div className="space-y-2">
              <Label>Role Name</Label>
              <p className="text-sm font-medium">{role?.name}</p>
              <p className="text-xs text-muted-foreground">
                Role name cannot be changed
              </p>
            </div>
          )}

          <div className="space-y-4">
            <Label>Permissions</Label>
            <div className="rounded-lg border p-4 space-y-3 max-h-96 overflow-y-auto">
              {allPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-start space-x-3 space-y-0"
                >
                  <Checkbox
                    id={permission.id}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() => togglePermission(permission.id)}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {permission.name}
                    </label>
                    {permission.description && (
                      <p className="text-sm text-muted-foreground">
                        {permission.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {selectedPermissions.length} of {allPermissions.length}{" "}
              permissions
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Role"
                  : "Update Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
