"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateClinicSettings } from "@/lib/actions/clinic";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Globe, Mail, Phone, MessageSquare } from "lucide-react";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}

export function ClinicProfileForm({ clinic }: { clinic: any }) {
  const [state, formAction] = useActionState(updateClinicSettings, {
    message: "",
    type: "",
  });
  const [formData, setFormData] = useState({
    name: clinic.name || "",
    bio: clinic.bio || "",
    slug: clinic.slug || "",
    googleReviewsUrl: clinic.googleReviewsUrl || "",
    email: clinic.email || "",
    phone: clinic.phone || "",
    whatsapp: clinic.whatsapp || "",
    isPublished: clinic.isPublished || false,
  });

  const [profilePreview, setProfilePreview] = useState(clinic.profileImage);
  const [coverPreview, setCoverPreview] = useState(clinic.coverImage);

  useEffect(() => {
    if (state.type === "success") toast.success(state.message);
    else if (state.type === "error") toast.error(state.message);
  }, [state]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (type === "profile") setProfilePreview(url);
      else setCoverPreview(url);
    }
  };

  const isChanged =
    formData.name !== (clinic.name || "") ||
    formData.bio !== (clinic.bio || "") ||
    formData.slug !== (clinic.slug || "") ||
    formData.googleReviewsUrl !== (clinic.googleReviewsUrl || "") ||
    formData.email !== (clinic.email || "") ||
    formData.phone !== (clinic.phone || "") ||
    formData.whatsapp !== (clinic.whatsapp || "") ||
    formData.isPublished !== clinic.isPublished ||
    profilePreview !== clinic.profileImage ||
    coverPreview !== clinic.coverImage;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Customize how your clinic looks to patients.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Image */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="bg-muted relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed">
                  {coverPreview ? (
                    <img
                      src={coverPreview}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <Camera className="text-muted-foreground mx-auto h-8 w-8" />
                      <span className="text-muted-foreground text-xs">
                        Upload cover photo
                      </span>
                    </div>
                  )}
                  <input
                    type="file"
                    name="coverImage"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => handleFileChange(e, "cover")}
                    accept="image/*"
                  />
                </div>
              </div>

              {/* Profile Image */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="border-background h-24 w-24 border-4 shadow-xl">
                    <AvatarImage src={profilePreview} />
                    <AvatarFallback className="text-2xl">
                      {formData.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Label className="bg-primary text-primary-foreground absolute right-0 bottom-0 cursor-pointer rounded-full p-1.5 shadow-sm">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      name="profileImage"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "profile")}
                      accept="image/*"
                    />
                  </Label>
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium">Clinic Logo</h4>
                  <p className="text-muted-foreground text-sm">
                    Recommended: Square image, min 400x400px.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Public Slug (Custom URL)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      /c/
                    </span>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="my-clinic-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">About / Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Briefly describe your clinic and services..."
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links & Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleReviewsUrl">Google Reviews URL</Label>
                <div className="flex items-center gap-2">
                  <Globe className="text-muted-foreground h-4 w-4" />
                  <Input
                    id="googleReviewsUrl"
                    name="googleReviewsUrl"
                    value={formData.googleReviewsUrl}
                    onChange={handleChange}
                    placeholder="https://g.page/r/your-clinic/review"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Main Contact</CardTitle>
              <CardDescription>
                Primary contact for the whole clinic.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    type="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="flex items-center gap-2">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    type="tel"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="flex items-center gap-2">
                  <MessageSquare className="text-muted-foreground h-4 w-4" />
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Published Online</Label>
                  <p className="text-muted-foreground text-xs">
                    Make your clinic profile public.
                  </p>
                </div>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(val) =>
                    setFormData((prev) => ({ ...prev, isPublished: val }))
                  }
                />
                <input
                  type="hidden"
                  name="isPublished"
                  value={formData.isPublished ? "true" : "false"}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <SubmitButton disabled={!isChanged} />
          </div>
        </div>
      </div>
    </form>
  );
}
