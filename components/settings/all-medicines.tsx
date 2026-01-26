"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface Medicine {
  id: string;
  type: string;
  medicineName: string;
  dosage?: string | null;
  administration?: string | null;
  unit?: string | null;
  time?: string | null;
  when?: string | null;
  where?: string | null;
  genericName?: string | null;
  frequency?: string | null;
  duration?: string | null;
  qty?: string | null;
  notes?: string | null;
}

interface MedicineFormData {
  type: string;
  medicineName: string;
  dosage: string;
  administration: string;
  unit: string;
  time: string;
  when: string;
  where: string;
  genericName: string;
  frequency: string;
  duration: string;
  qty: string;
  notes: string;
}

const emptyForm: MedicineFormData = {
  type: "",
  medicineName: "",
  dosage: "",
  administration: "",
  unit: "",
  time: "",
  when: "",
  where: "",
  genericName: "",
  frequency: "",
  duration: "",
  qty: "",
  notes: "",
};

export function AllMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState<MedicineFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedicines();
  }, [page, searchQuery]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/medicines?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch medicines");
      const data = await response.json();
      setMedicines(data.medicines);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch medicines");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSheet = (medicine?: Medicine) => {
    if (medicine) {
      setEditingMedicine(medicine);
      setFormData({
        type: medicine.type,
        medicineName: medicine.medicineName,
        dosage: medicine.dosage || "",
        administration: medicine.administration || "",
        unit: medicine.unit || "",
        time: medicine.time || "",
        when: medicine.when || "",
        where: medicine.where || "",
        genericName: medicine.genericName || "",
        frequency: medicine.frequency || "",
        duration: medicine.duration || "",
        qty: medicine.qty || "",
        notes: medicine.notes || "",
      });
    } else {
      setEditingMedicine(null);
      setFormData(emptyForm);
    }
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
    setEditingMedicine(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type || !formData.medicineName) {
      toast.error("Type and Medicine Name are required");
      return;
    }

    try {
      setSubmitting(true);

      const url = "/api/medicines";
      const method = editingMedicine ? "PUT" : "POST";
      const body = editingMedicine
        ? { id: editingMedicine.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save medicine");
      }

      toast.success(
        editingMedicine
          ? "Medicine updated successfully"
          : "Medicine added successfully",
      );
      handleCloseSheet();
      fetchMedicines();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    try {
      const response = await fetch(`/api/medicines?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete medicine");

      toast.success("Medicine deleted successfully");
      fetchMedicines();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/medicines/export");
      if (!response.ok) throw new Error("Failed to export medicines");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medicines-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Medicines exported successfully");
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/medicines/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import medicines");
      }

      toast.success(
        `Imported ${data.imported} of ${data.total} medicines${
          data.errors ? ` (${data.errors.length} errors)` : ""
        }`,
      );

      if (data.errors && data.errors.length > 0) {
        console.warn("Import errors:", data.errors);
      }

      fetchMedicines();
    } catch (error: any) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1 w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by medicine name, generic name, or type..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium">{total}</span> medicines
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button size="sm" onClick={() => handleOpenSheet()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Medicine Name</TableHead>
                <TableHead>Generic Name</TableHead>
                <TableHead className="w-[100px]">Dosage</TableHead>
                <TableHead>Administration</TableHead>
                <TableHead className="w-[80px]">Unit</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : medicines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery
                        ? "No medicines found matching your search."
                        : "No medicines yet. Add your first medicine to get started."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                medicines.map((medicine) => (
                  <TableRow key={medicine.id} className="h-12">
                    <TableCell className="font-medium">
                      {medicine.type}
                    </TableCell>
                    <TableCell>{medicine.medicineName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {medicine.genericName || "-"}
                    </TableCell>
                    <TableCell>{medicine.dosage || "-"}</TableCell>
                    <TableCell>{medicine.administration || "-"}</TableCell>
                    <TableCell>{medicine.unit || "-"}</TableCell>
                    <TableCell>{medicine.frequency || "-"}</TableCell>
                    <TableCell>{medicine.duration || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSheet(medicine)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(medicine.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit Medicine Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingMedicine ? "Edit Medicine" : "Add New Medicine"}
            </SheetTitle>
            <SheetDescription>
              Fill in the details below to {editingMedicine ? "update" : "add"}{" "}
              a medicine to your library.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tablet">Tablet</SelectItem>
                    <SelectItem value="Capsule">Capsule</SelectItem>
                    <SelectItem value="Syrup">Syrup</SelectItem>
                    <SelectItem value="Injection">Injection</SelectItem>
                    <SelectItem value="Drops">Drops</SelectItem>
                    <SelectItem value="Cream">Cream</SelectItem>
                    <SelectItem value="Ointment">Ointment</SelectItem>
                    <SelectItem value="Inhaler">Inhaler</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicineName">
                  Medicine Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="medicineName"
                  value={formData.medicineName}
                  onChange={(e) =>
                    setFormData({ ...formData, medicineName: e.target.value })
                  }
                  placeholder="e.g., Paracetamol"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genericName">Generic Name</Label>
                <Input
                  id="genericName"
                  value={formData.genericName}
                  onChange={(e) =>
                    setFormData({ ...formData, genericName: e.target.value })
                  }
                  placeholder="e.g., Acetaminophen"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) =>
                    setFormData({ ...formData, dosage: e.target.value })
                  }
                  placeholder="e.g., 500mg, 10ml"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="administration">Administration</Label>
                <Select
                  value={formData.administration}
                  onValueChange={(value) =>
                    setFormData({ ...formData, administration: value })
                  }
                >
                  <SelectTrigger id="administration">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Oral">Oral</SelectItem>
                    <SelectItem value="IV">IV (Intravenous)</SelectItem>
                    <SelectItem value="IM">IM (Intramuscular)</SelectItem>
                    <SelectItem value="SC">SC (Subcutaneous)</SelectItem>
                    <SelectItem value="Topical">Topical</SelectItem>
                    <SelectItem value="Inhalation">Inhalation</SelectItem>
                    <SelectItem value="Rectal">Rectal</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="e.g., mg, ml, units"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Input
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  placeholder="e.g., Once daily, Twice daily"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="e.g., 5 days, 1 week"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  placeholder="e.g., Morning, Evening"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="when">When</Label>
                <Select
                  value={formData.when}
                  onValueChange={(value) =>
                    setFormData({ ...formData, when: value })
                  }
                >
                  <SelectTrigger id="when">
                    <SelectValue placeholder="Select timing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Before meals">Before meals</SelectItem>
                    <SelectItem value="After meals">After meals</SelectItem>
                    <SelectItem value="With meals">With meals</SelectItem>
                    <SelectItem value="Empty stomach">Empty stomach</SelectItem>
                    <SelectItem value="Anytime">Anytime</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="where">Where</Label>
                <Input
                  id="where"
                  value={formData.where}
                  onChange={(e) =>
                    setFormData({ ...formData, where: e.target.value })
                  }
                  placeholder="e.g., Left arm, Right thigh"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  value={formData.qty}
                  onChange={(e) =>
                    setFormData({ ...formData, qty: e.target.value })
                  }
                  placeholder="e.g., 10, 30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes or instructions..."
                rows={3}
              />
            </div>

            <SheetFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseSheet}
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
                ) : editingMedicine ? (
                  "Update Medicine"
                ) : (
                  "Add Medicine"
                )}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
