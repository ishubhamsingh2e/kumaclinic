"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface UserProfileFormProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    title?: string | null;
    phone?: string | null;
    dob?: Date | string | null;
    address?: string | null;
    licenseNumber?: string | null;
    slotDurationInMin?: number | null;
    role?: string | null;
  };
}

export function UserProfileForm({ user }: UserProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    user.dob ? new Date(user.dob) : undefined,
  );
  const [showSlotDurationAlert, setShowSlotDurationAlert] = useState(false);

  // Local state for other fields to track changes
  const [formData, setFormData] = useState({
    title: user.title || "",
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    licenseNumber: user.licenseNumber || "",
    slotDurationInMin: user.slotDurationInMin?.toString() || "30",
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user.image || null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageFile(file);
    }
  };

  const isChanged =
    formData.title !== (user.title || "") ||
    formData.name !== (user.name || "") ||
    formData.email !== (user.email || "") ||
    formData.phone !== (user.phone || "") ||
    formData.address !== (user.address || "") ||
    formData.licenseNumber !== (user.licenseNumber || "") ||
    formData.slotDurationInMin !==
      (user.slotDurationInMin?.toString() || "30") ||
    date?.getTime() !== (user.dob ? new Date(user.dob).getTime() : undefined) ||
    imageFile !== null;

  const isDoctor = formData.title === "Dr.";

  const isSlotDurationChanged =
    formData.slotDurationInMin !== (user.slotDurationInMin?.toString() || "30");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if slot duration changed for doctors
    if (isDoctor && isSlotDurationChanged) {
      setShowSlotDurationAlert(true);
      return;
    }

    await submitForm();
  };

  const submitForm = async () => {
    setIsSubmitting(true);

    try {
      let imagePath = user.image;

      // Upload image if changed
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload/avatar", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || "Failed to upload image");
        }

        imagePath = uploadData.path;
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dob: date ? date.toISOString() : null,
          image: imagePath,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success(data.message || "Profile updated successfully");

      // Refresh the page to show updated data
      router.refresh();

      // Reset image file state
      setImageFile(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmSlotDurationChange = async () => {
    setShowSlotDurationAlert(false);
    await submitForm();
  };

  const cancelSlotDurationChange = () => {
    setShowSlotDurationAlert(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <Avatar className="border-border h-24 w-24 border-2">
                <AvatarImage src={previewUrl || ""} alt="Profile picture" />
                <AvatarFallback className="bg-muted">
                  <User className="text-muted-foreground h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="image-upload"
                className="bg-primary text-primary-foreground hover:bg-primary/90 absolute right-0 bottom-0 cursor-pointer rounded-full p-1 shadow-sm transition-colors"
              >
                <Camera className="h-4 w-4" />
                <span className="sr-only">Change profile photo</span>
              </Label>
              <Input
                id="image-upload"
                name="image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">Profile Photo</h3>
              <p className="text-muted-foreground text-sm">
                Click the camera icon to upload a new photo.
                <br />
                JPG, PNG or WebP. 5MB max.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="title">Title</Label>
              <Select
                name="title"
                value={formData.title}
                onValueChange={(val) => handleChange("title", val)}
              >
                <SelectTrigger id="title" className="w-full">
                  <SelectValue placeholder="title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mr.">Mr.</SelectItem>
                  <SelectItem value="Ms.">Ms.</SelectItem>
                  <SelectItem value="Mrs.">Mrs.</SelectItem>
                  <SelectItem value="Dr.">Dr.</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="m@example.com"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {isDoctor && (
              <>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      handleChange("licenseNumber", e.target.value)
                    }
                    placeholder="LIC-123456"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="slotDuration">Slot Duration (minutes)</Label>
                  <Input
                    id="slotDuration"
                    name="slotDurationInMin"
                    type="number"
                    min="5"
                    max="120"
                    value={formData.slotDurationInMin}
                    onChange={(e) =>
                      handleChange("slotDurationInMin", e.target.value)
                    }
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Duration of each appointment slot in minutes (default: 30).
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="123 Main St, City, Country"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isChanged}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>

      {/* Slot Duration Change Alert Dialog */}
      <AlertDialog
        open={showSlotDurationAlert}
        onOpenChange={setShowSlotDurationAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Slot Duration?</AlertDialogTitle>
            <AlertDialogDescription>
              Changing the slot duration will reset all your availability slots.
              All your currently set appointment slots will be cleared and
              you'll need to set them up again based on the new slot duration.
              <br />
              <br />
              <strong>Are you sure you want to continue?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelSlotDurationChange}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSlotDurationChange}>
              Yes, Change Duration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
