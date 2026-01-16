"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUser } from "@/lib/actions/user";
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
import { CalendarIcon, CircleAlert, Camera, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    role?: string | null;
  };
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  );
}

export function UserProfileForm({ user }: UserProfileFormProps) {
  const initialState = { type: "", message: "" };
  const [state, formAction] = useActionState(updateUser, initialState);
  const [date, setDate] = useState<Date | undefined>(
    user.dob ? new Date(user.dob) : undefined,
  );

  // Local state for other fields to track changes
  const [formData, setFormData] = useState({
    title: user.title || "",
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    licenseNumber: user.licenseNumber || "",
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    date?.getTime() !== (user.dob ? new Date(user.dob).getTime() : undefined) ||
    imageFile !== null;

  useEffect(() => {
    if (state?.type === "success") {
      toast.success(state.message);
    } else if (state?.type === "error") {
      toast.error(state.message);
    } else if (state?.type === "info") {
      toast.info(state.message);
    }
  }, [state]);

  const isDoctor =
    user.role === "DOCTOR" ||
    user.role === "CLINIC_MANAGER" ||
    user.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">

      <form action={formAction}>
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={previewUrl || ""} alt="Profile picture" />
                <AvatarFallback className="bg-muted">
                  <User className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <Label
                htmlFor="image-upload"
                className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-sm"
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
              <h3 className="font-medium text-lg">Profile Photo</h3>
              <p className="text-sm text-muted-foreground">
                Click the camera icon to upload a new photo.
                <br />
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="title">Title</Label>
              <Select
                name="title"
                defaultValue={formData.title}
                onValueChange={(val) => handleChange("title", val)}
              >
                <SelectTrigger id="title" className="w-full">
                  <SelectValue placeholder="Select title" />
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
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="dob"
                value={date ? date.toISOString().split("T")[0] : ""}
              />
            </div>

            {isDoctor && (
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
            <SubmitButton disabled={!isChanged} />
          </div>
        </div>
      </form>
    </div>
  );
}
