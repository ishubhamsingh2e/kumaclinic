"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  FolderPlus,
  Folder,
  X,
  EyeIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Medicine {
  id: string;
  type: string;
  medicineName: string;
  dosage?: string | null;
  genericName?: string | null;
}

interface MedicineGroup {
  id: string;
  name: string;
  _count: {
    MedicineGroupItem: number;
  };
}

export function MedicineGroups() {
  const [groups, setGroups] = useState<MedicineGroup[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Group management
  const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MedicineGroup | null>(null);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMedicines, setGroupMedicines] = useState<Medicine[]>([]);
  const [selectedMedicineIds, setSelectedMedicineIds] = useState<Set<string>>(
    new Set(),
  );
  const [isAddMedicinesSheetOpen, setIsAddMedicinesSheetOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchAllMedicines();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGroupMedicines(selectedGroupId);
    }
  }, [selectedGroupId]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/medicine-groups");
      if (!response.ok) throw new Error("Failed to fetch groups");
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      toast.error("Failed to fetch groups");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMedicines = async () => {
    try {
      const response = await fetch("/api/medicines?limit=1000");
      if (!response.ok) throw new Error("Failed to fetch medicines");
      const data = await response.json();
      setMedicines(data.medicines);
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
    }
  };

  const fetchGroupMedicines = async (groupId: string) => {
    try {
      const response = await fetch(`/api/medicine-groups/${groupId}/medicines`);
      if (!response.ok) throw new Error("Failed to fetch group medicines");
      const data = await response.json();
      setGroupMedicines(data);
    } catch (error) {
      toast.error("Failed to fetch group medicines");
      console.error(error);
    }
  };

  const handleOpenGroupSheet = (group?: MedicineGroup) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.name);
    } else {
      setEditingGroup(null);
      setGroupName("");
    }
    setIsGroupSheetOpen(true);
  };

  const handleCloseGroupSheet = () => {
    setIsGroupSheetOpen(false);
    setEditingGroup(null);
    setGroupName("");
  };

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    try {
      setSubmitting(true);

      const url = "/api/medicine-groups";
      const method = editingGroup ? "PUT" : "POST";
      const body = editingGroup
        ? { id: editingGroup.id, name: groupName }
        : { name: groupName };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save group");
      }

      toast.success(
        editingGroup
          ? "Group updated successfully"
          : "Group created successfully",
      );
      handleCloseGroupSheet();
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;

    try {
      const response = await fetch(`/api/medicine-groups?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete group");

      toast.success("Group deleted successfully");
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
      }
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const handleOpenAddMedicinesSheet = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedMedicineIds(new Set());
    setIsAddMedicinesSheetOpen(true);
  };

  const handleAddMedicinesToGroup = async () => {
    if (!selectedGroupId || selectedMedicineIds.size === 0) {
      toast.error("Please select at least one medicine");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/medicine-groups/${selectedGroupId}/medicines`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medicineIds: Array.from(selectedMedicineIds),
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add medicines to group");
      }

      toast.success("Medicines added to group successfully");
      setIsAddMedicinesSheetOpen(false);
      fetchGroups();
      fetchGroupMedicines(selectedGroupId);
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMedicineFromGroup = async (
    groupId: string,
    medicineId: string,
  ) => {
    if (!confirm("Remove this medicine from the group?")) return;

    try {
      const response = await fetch(
        `/api/medicine-groups/${groupId}/medicines?medicineId=${medicineId}`,
        { method: "DELETE" },
      );

      if (!response.ok) throw new Error("Failed to remove medicine from group");

      toast.success("Medicine removed from group");
      fetchGroups();
      fetchGroupMedicines(groupId);
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const toggleMedicineSelection = (medicineId: string) => {
    const newSet = new Set(selectedMedicineIds);
    if (newSet.has(medicineId)) {
      newSet.delete(medicineId);
    } else {
      newSet.add(medicineId);
    }
    setSelectedMedicineIds(newSet);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Organize your medicines into groups for quick access
        </p>
        <Button size="sm" onClick={() => handleOpenGroupSheet()}>
          <FolderPlus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Folder className="h-4 w-4" />
                {group.name}
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleOpenGroupSheet(group)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDeleteGroup(group.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {group._count.MedicineGroupItem} medicines
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAddMedicinesSheet(group.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      fetchGroupMedicines(group.id);
                    }}
                  >
                    <EyeIcon className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groups.length === 0 && (
        <Card>
          <div className="text-center p-12">
            <Folder className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No groups yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first group to organize medicines
            </p>
          </div>
        </Card>
      )}

      {/* Group Medicines Viewer */}
      {selectedGroupId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Group Medicines</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedGroupId(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupMedicines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No medicines in this group yet
                </p>
              ) : (
                groupMedicines.map((medicine) => (
                  <div
                    key={medicine.id}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <div className="font-medium">{medicine.medicineName}</div>
                      <div className="text-sm text-muted-foreground">
                        {medicine.type} • {medicine.dosage || "N/A"}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleRemoveMedicineFromGroup(
                          selectedGroupId,
                          medicine.id,
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Group Sheet */}
      <Sheet open={isGroupSheetOpen} onOpenChange={setIsGroupSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {editingGroup ? "Edit Group" : "Create Group"}
            </SheetTitle>
            <SheetDescription>
              {editingGroup ? "Update" : "Create"} a group to organize your
              medicines
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleGroupSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">
                Group Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Pain Relief, Antibiotics"
              />
            </div>

            <SheetFooter className="px-0 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseGroupSheet}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingGroup ? (
                  "Update Group"
                ) : (
                  "Create Group"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Add Medicines to Group Sheet */}
      <Sheet
        open={isAddMedicinesSheetOpen}
        onOpenChange={setIsAddMedicinesSheetOpen}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Medicines to Group</SheetTitle>
            <SheetDescription>
              Select medicines to add to this group
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {medicines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No medicines available. Add medicines first.
                </p>
              ) : (
                medicines.map((medicine) => (
                  <div
                    key={medicine.id}
                    className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`medicine-${medicine.id}`}
                      checked={selectedMedicineIds.has(medicine.id)}
                      onCheckedChange={() =>
                        toggleMedicineSelection(medicine.id)
                      }
                    />
                    <label
                      htmlFor={`medicine-${medicine.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{medicine.medicineName}</div>
                      <div className="text-sm text-muted-foreground">
                        {medicine.type} • {medicine.dosage || "N/A"}
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>

            <SheetFooter className="px-0 flex flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddMedicinesSheetOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMedicinesToGroup}
                disabled={submitting || selectedMedicineIds.size === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add ${selectedMedicineIds.size} Medicine${
                    selectedMedicineIds.size !== 1 ? "s" : ""
                  }`
                )}
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
