"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MapPin, Phone, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  upsertClinicLocation,
  deleteClinicLocation,
} from "@/lib/actions/clinic";
import { toast } from "sonner";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function LocationManagement({ locations }: { locations: any[] }) {
  const [isDialogOpen, setIsInviteOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);

  const handleSave = async (formData: FormData) => {
    const data = Object.fromEntries(formData.entries());
    const openingHours: any = {};

    DAYS.forEach((day) => {
      const d = day.toLowerCase();
      openingHours[d] = {
        open: data[`${d}_open`],
        close: data[`${d}_close`],
        closed: data[`${d}_closed`] === "on",
      };
    });

    const locationData = {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      phone: data.phone,
      email: data.email,
      whatsapp: data.whatsapp,
      googleMapsUrl: data.googleMapsUrl,
      openingHours,
    };

    const res = await upsertClinicLocation(
      editingLocation?.id || null,
      locationData,
    );
    if (res.type === "success") {
      toast.success(res.message);
      setIsInviteOpen(false);
      setEditingLocation(null);
    } else {
      toast.error(res.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await deleteClinicLocation(id);
    if (res.type === "success") toast.success(res.message);
    else toast.error(res.message);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Branch Locations</h3>
        <Button
          onClick={() => {
            setEditingLocation(null);
            setIsInviteOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Location
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {locations.map((loc) => (
          <Card key={loc.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-semibold">
                  {loc.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingLocation(loc);
                      setIsInviteOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDelete(loc.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" /> {loc.address}, {loc.city}
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                {loc.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {loc.phone}
                  </div>
                )}
                {loc.whatsapp && (
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {loc.whatsapp}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Edit Location" : "Add New Location"}
            </DialogTitle>
            <DialogDescription>
              Enter branch details and opening hours.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSave} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">
                  Location Name (e.g. Downtown Branch)
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingLocation?.name}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  defaultValue={editingLocation?.address}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={editingLocation?.city}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  defaultValue={editingLocation?.state}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Branch Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editingLocation?.phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Branch WhatsApp</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  defaultValue={editingLocation?.whatsapp}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
                <Input
                  id="googleMapsUrl"
                  name="googleMapsUrl"
                  defaultValue={editingLocation?.googleMapsUrl}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Opening Hours</Label>
              <div className="space-y-3">
                {DAYS.map((day) => {
                  const d = day.toLowerCase();
                  const hours = editingLocation?.openingHours?.[d] || {
                    open: "09:00",
                    close: "17:00",
                    closed: false,
                  };
                  return (
                    <div
                      key={day}
                      className="grid grid-cols-4 items-center gap-4"
                    >
                      <Label className="font-medium">{day}</Label>
                      <Input
                        type="time"
                        name={`${d}_open`}
                        defaultValue={hours.open}
                        className="col-span-1"
                      />
                      <Input
                        type="time"
                        name={`${d}_close`}
                        defaultValue={hours.close}
                        className="col-span-1"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Closed</Label>
                        <input
                          type="checkbox"
                          name={`${d}_closed`}
                          defaultChecked={hours.closed}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Save Location</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
