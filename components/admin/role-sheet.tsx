"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

interface RoleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  role?: Role;
  allPermissions: Permission[];
  onSuccess: () => void;
}

export function RoleSheet({
  open,
  onOpenChange,
  mode,
  role,
  allPermissions,
  onSuccess,
}: RoleSheetProps) {
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && role && mode === "edit") {
      setRoleName(role.name);
      setSelectedPermissions(role.permissions.map((p) => p.id));
    } else if (open && mode === "create") {
      setRoleName("");
      setSelectedPermissions([]);
    }
  }, [open, role, mode]);

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error("Please select at least one permission");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const response = await fetch("/api/admin/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: roleName.toUpperCase().replace(/\s+/g, "_"),
            permissionIds: selectedPermissions,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create role");
        }

        toast.success("Role created successfully");
      } else if (mode === "edit" && role) {
        const response = await fetch("/api/admin/roles", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleId: role.id,
            name: roleName.toUpperCase().replace(/\s+/g, "_"),
            permissionIds: selectedPermissions,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update role");
        }

        toast.success("Role updated successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:min-w-2xl overflow-y-auto h-full">
        <form className="h-full flex flex-col" onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>
              {mode === "create" ? "Create New Role" : "Edit Role"}
            </SheetTitle>
            <SheetDescription>
              {mode === "create"
                ? "Create a new role with specific permissions"
                : "Update role name and permissions"}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6 p-4 flex flex-col h-full overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g., CLINIC_MANAGER"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                Will be converted to uppercase with underscores
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Permissions</Label>
                <span className="text-sm text-muted-foreground">
                  {selectedPermissions.length} selected
                </span>
              </div>
              <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto space-y-3">
                {allPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-start space-x-3"
                  >
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() =>
                        handlePermissionToggle(permission.id)
                      }
                      disabled={isSubmitting}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={permission.id}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {permission.name}
                      </Label>
                      {permission.description && (
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter className="grid grid-cols-2 gap-2 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Processing..."
                : mode === "create"
                  ? "Create Role"
                  : "Update Role"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
