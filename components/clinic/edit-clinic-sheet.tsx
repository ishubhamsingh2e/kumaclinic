"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { updateClinic, deleteClinic, type AddClinicFormData } from "@/lib/actions/clinics";
import { toast } from "sonner";
import { Loader2, Info, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
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

interface Clinic {
  id: string;
  name: string;
  bio: string | null;
  coverImage: string | null;
  profileImage: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  googleMapsUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  googleReviewsUrl: string | null;
  isBranch: boolean;
  parentClinicId: string | null;
}

interface ParentClinicOption {
  id: string;
  name: string;
  isBranch: boolean;
}

interface EditClinicSheetProps {
  clinic: Clinic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allClinics?: ParentClinicOption[];
}

export function EditClinicSheet({
  clinic,
  open,
  onOpenChange,
  allClinics = [],
}: EditClinicSheetProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [uploading, setUploading] = useState<"cover" | "profile" | null>(null);
  const [formData, setFormData] = useState<AddClinicFormData>({
    name: "",
    bio: "",
    coverImage: null,
    profileImage: null,
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zip: "",
    googleMapsUrl: "",
    instagram: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    googleReviewsUrl: "",
    isBranch: false,
    parentClinicId: null,
  });

  // Filter to only show independent clinics as parent options (excluding current clinic)
  const availableParentClinics = allClinics.filter(
    (c) => !c.isBranch && c.id !== clinic.id,
  );

  // Populate form when clinic changes
  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || "",
        bio: clinic.bio || "",
        coverImage: clinic.coverImage || null,
        profileImage: clinic.profileImage || null,
        email: clinic.email || "",
        phone: clinic.phone || "",
        whatsapp: clinic.whatsapp || "",
        address: clinic.address || "",
        city: clinic.city || "",
        state: clinic.state || "",
        country: clinic.country || "",
        zip: clinic.zip || "",
        googleMapsUrl: clinic.googleMapsUrl || "",
        instagram: clinic.instagram || "",
        facebook: clinic.facebook || "",
        twitter: clinic.twitter || "",
        linkedin: clinic.linkedin || "",
        googleReviewsUrl: clinic.googleReviewsUrl || "",
        isBranch: clinic.isBranch,
        parentClinicId: clinic.parentClinicId || null,
      });
    }
  }, [clinic]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "profile",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(type);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          [type === "cover" ? "coverImage" : "profileImage"]: imageUrl,
        }));
        setUploading(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process image");
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await updateClinic(clinic.id, formData);

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Clinic updated successfully!");
    onOpenChange(false);
    setLoading(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    
    const result = await deleteClinic(clinic.id);
    
    if (result.error) {
      toast.error(result.error);
      setDeleting(false);
      setShowDeleteDialog(false);
      return;
    }
    
    toast.success("Clinic deleted successfully!");
    setShowDeleteDialog(false);
    setDeleting(false);
    onOpenChange(false);
    router.refresh();
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:min-w-2xl">
        <SheetHeader>
          <SheetTitle>Edit Clinic</SheetTitle>
          <SheetDescription>
            Update clinic information and settings.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="p-4 pt-0">
          <div className="grid gap-4">
            {/* Branch Info - Read Only */}
            {clinic.isBranch && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This is a branch location. Only essential contact and location
                  information can be edited.
                </AlertDescription>
              </Alert>
            )}

            {/* Parent Clinic Selector - Only for branches */}
            {clinic.isBranch && availableParentClinics.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="parentClinic">Parent Clinic (Optional)</Label>
                <Select
                  value={formData.parentClinicId || "none"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      parentClinicId: value === "none" ? null : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent clinic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableParentClinics.map((parentClinic) => (
                      <SelectItem key={parentClinic.id} value={parentClinic.id}>
                        {parentClinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Link this branch to a parent clinic
                </p>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Basic Information</h3>
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Clinic Name <span className="text-destructive">*</span>
                </Label>
                {clinic.isBranch && (
                  <p className="text-xs text-muted-foreground">
                    For internal reference only
                  </p>
                )}
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Downtown Medical Clinic"
                  required
                />
              </div>

              {!clinic.isBranch && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio / Description</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Brief description of your clinic..."
                      rows={3}
                    />
                  </div>

                  {/* Profile Images Section */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm">Profile Images</h3>

                    {/* Cover Image */}
                    <div className="grid gap-2">
                      <Label htmlFor="coverImage">Cover Image</Label>
                      <div className="flex items-center gap-4">
                        {formData.coverImage && (
                          <div className="relative w-32 h-20 rounded-md overflow-hidden border">
                            <img
                              src={formData.coverImage}
                              alt="Cover preview"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  coverImage: null,
                                }))
                              }
                            >
                              ×
                            </Button>
                          </div>
                        )}
                        <Input
                          id="coverImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "cover")}
                          disabled={uploading === "cover"}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 1200x300px. Max 5MB.
                      </p>
                    </div>

                    {/* Profile Image (Logo) */}
                    <div className="grid gap-2">
                      <Label htmlFor="profileImage">Logo</Label>
                      <div className="flex items-center gap-4">
                        {formData.profileImage && (
                          <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                            <img
                              src={formData.profileImage}
                              alt="Logo preview"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  profileImage: null,
                                }))
                              }
                            >
                              ×
                            </Button>
                          </div>
                        )}
                        <Input
                          id="profileImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, "profile")}
                          disabled={uploading === "profile"}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended size: 400x400px. Max 5MB.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="clinic@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Address</h3>
              <div className="grid gap-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip">ZIP/Postal Code</Label>
                  <Input
                    id="zip"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    placeholder="12345"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                <Input
                  id="googleMapsUrl"
                  name="googleMapsUrl"
                  value={formData.googleMapsUrl}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>

            {/* Social Media */}
            {!clinic.isBranch && (
              <div className="space-y-4">
                <h3 className="font-medium text-sm">Social Media (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      placeholder="@username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleChange}
                      placeholder="facebook.com/page"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleChange}
                      placeholder="@username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      name="linkedin"
                      value={formData.linkedin}
                      placeholder="linkedin.com/company/..."
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="googleReviewsUrl">Google Reviews URL</Label>
                  <Input
                    id="googleReviewsUrl"
                    name="googleReviewsUrl"
                    value={formData.googleReviewsUrl}
                    onChange={handleChange}
                    placeholder="https://g.page/..."
                  />
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="mt-6 grid grid-cols-3 px-0 gap-4">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading || deleting}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || deleting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || deleting}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Updating..." : "Update"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Clinic</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{clinic.name}</strong>?
            {!clinic.isBranch && (
              <span className="block mt-2 text-destructive">
                Note: You must have at least one independent clinic. This action cannot be undone.
              </span>
            )}
            {clinic.isBranch && (
              <span className="block mt-2">
                This action cannot be undone.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {deleting ? "Deleting..." : "Delete Clinic"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
