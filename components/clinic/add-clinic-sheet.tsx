"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { addNewClinic, type AddClinicFormData } from "@/lib/actions/clinics";
import { toast } from "sonner";
import { Plus, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";

interface Clinic {
  id: string;
  name: string;
  isBranch: boolean;
}

interface AddClinicSheetProps {
  allClinics?: Clinic[];
}

export function AddClinicSheet({ allClinics = [] }: AddClinicSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isBranch, setIsBranch] = useState(false);
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

  // Filter to only show independent clinics as parent options
  const availableParentClinics = allClinics.filter((c) => !c.isBranch);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await addNewClinic({ ...formData, isBranch });

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success(`${isBranch ? "Branch" : "Clinic"} created successfully!`);
    setOpen(false);
    setLoading(false);
    setIsBranch(false);
    setFormData({
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
    router.refresh();
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
      // For new clinics, we'll store the file temporarily and show preview
      // The actual upload will happen after clinic is created
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus /> Add New Clinic
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:min-w-2xl">
        <SheetHeader>
          <SheetTitle>Add New Clinic</SheetTitle>
          <SheetDescription>
            Create a new clinic location with its own staff and settings.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="p-4 pt-0">
          <div className="grid gap-4">
            {/* Clinic Type Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-1">
                <Label htmlFor="clinic-type">Clinic Type</Label>
                <p className="text-sm text-muted-foreground">
                  {isBranch
                    ? "Branch location with essential information only"
                    : "Independent clinic with full profile"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {isBranch ? "Branch" : "Independent"}
                </span>
                <Switch
                  id="clinic-type"
                  checked={isBranch}
                  onCheckedChange={setIsBranch}
                />
              </div>
            </div>

            {/* Branch Info Alert */}
            {isBranch && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Branches require only essential contact and location
                  information. Profile images, detailed descriptions, and social
                  media links are not needed.
                </AlertDescription>
              </Alert>
            )}

            {/* Parent Clinic Selector - Only for branches */}
            {isBranch && availableParentClinics.length > 0 && (
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
                    {availableParentClinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
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
                {isBranch && (
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

              {!isBranch && (
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
                <Textarea
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
            {!isBranch && (
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

          <SheetFooter className="mt-6 px-0 grid grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Clinic
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
