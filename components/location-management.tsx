"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  addClinicLocation,
  updateClinicLocation,
  deleteClinicLocation,
} from "@/lib/actions/clinic";
import { toast } from "sonner";
import { ClinicLocation } from "@prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Plus, Trash, Edit } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

const locationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof locationSchema>;

interface LocationManagementProps {
  locations: ClinicLocation[];
}

export function LocationManagement({ locations }: LocationManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ClinicLocation | null>(
    null,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(locationSchema),
  });

  const {
    formState: { isSubmitting },
    reset,
  } = form;

  const onSubmit = async (values: FormValues) => {
    const result = editingLocation
      ? await updateClinicLocation(editingLocation.id, values)
      : await addClinicLocation(values);

    if (result.success) {
      toast.success(
        `Location ${editingLocation ? "updated" : "added"} successfully.`,
      );
      setIsDialogOpen(false);
    } else {
      toast.error(result.error || "An error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteClinicLocation(id);
    if (result.success) {
      toast.success("Location deleted successfully.");
    } else {
      toast.error(result.error || "Failed to delete location.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Management</CardTitle>
        <CardDescription>Manage your clinic's locations.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingLocation(null);
                reset({});
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? "Edit Location" : "Add Location"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Location Name</FieldLabel>
                  <Input {...form.register("name")} />
                  {form.formState.errors.name && (
                    <FieldError>
                      {form.formState.errors.name.message}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Address</FieldLabel>
                  <Input {...form.register("address")} />
                  {form.formState.errors.address && (
                    <FieldError>
                      {form.formState.errors.address.message}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>City</FieldLabel>
                  <Input {...form.register("city")} />
                  {form.formState.errors.city && (
                    <FieldError>
                      {form.formState.errors.city.message}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>State</FieldLabel>
                  <Input {...form.register("state")} />
                  {form.formState.errors.state && (
                    <FieldError>
                      {form.formState.errors.state.message}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Zip/Postal Code</FieldLabel>
                  <Input {...form.register("zip")} />
                  {form.formState.errors.zip && (
                    <FieldError>{form.formState.errors.zip.message}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Phone</FieldLabel>
                  <Input {...form.register("phone")} />
                  {form.formState.errors.phone && (
                    <FieldError>
                      {form.formState.errors.phone.message}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input type="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <FieldError>
                      {form.formState.errors.email.message}
                    </FieldError>
                  )}
                </Field>
                <Field>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Location"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </DialogContent>
        </Dialog>

        <div className="mt-4 space-y-2">
          {locations.map((location) => (
            <div
              key={location.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="font-semibold">{location.name}</p>
                <p className="text-sm text-muted-foreground">
                  {location.address}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingLocation(location);
                    reset({
                      name: location.name,
                      address: location.address,
                      city: location.city ?? undefined,
                      state: location.state ?? undefined,
                      zip: location.zip ?? undefined,
                      phone: location.phone ?? undefined,
                      email: location.email ?? undefined,
                    });
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this location.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(location.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
