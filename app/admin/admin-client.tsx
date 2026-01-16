"use client";

import {
  JSXElementConstructor,
  ReactElement,
  ReactNode,
  ReactPortal,
  useState,
} from "react";
import {
  Plus,
  Building2,
  User as UserIcon,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClinic, assignClinicManagerRole } from "@/lib/actions/admin";
import {
  Clinic,
  ClinicMember,
  Role,
  User,
} from "@/lib/generated/prisma/client";

type UserWithRelations = User & {
  memberships: (ClinicMember & { role: Role; clinic: Clinic })[];
};

export function AdminClient({
  users,
  clinics,
}: {
  users: UserWithRelations[];
  clinics: Clinic[];
}) {
  const [isClinicOpen, setIsClinicOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedClinic, setSelectedClinic] = useState<string>("");

  async function handleCreateClinic(formData: FormData) {
    const res = await createClinic(null, formData);
    if (res.type === "success") {
      toast.success(res.message);
      setIsClinicOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  async function handleAssign() {
    if (!selectedUser || !selectedClinic) {
      toast.error("Please select both a user and a clinic");
      return;
    }
    const res = await assignClinicManagerRole(selectedUser, selectedClinic);
    if (res.type === "success") {
      toast.success(res.message);
      setIsAssignOpen(false);
      setSelectedUser("");
      setSelectedClinic("");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex gap-4">
        <Dialog open={isClinicOpen} onOpenChange={setIsClinicOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Clinic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Clinic</DialogTitle>
              <DialogDescription>
                Add a new clinic to the platform.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateClinic} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Clinic Name</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Health Care Plus"
                />
              </div>
              <DialogFooter>
                <Button type="submit">Create Clinic</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <LinkIcon className="mr-2 h-4 w-4" /> Assign Manager
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Clinic Manager</DialogTitle>
              <DialogDescription>
                Promote a user to manager of a specific clinic.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(
                        (u) =>
                          !u.memberships.some(
                            (m: { role: { name: string } }) =>
                              m.role.name === "SUPER_ADMIN",
                          ),
                      )
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Clinic</Label>
                <Select
                  value={selectedClinic}
                  onValueChange={setSelectedClinic}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select clinic..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((clinic) => (
                      <SelectItem key={clinic.id} value={clinic.id}>
                        {clinic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAssign}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Clinics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell className="font-medium">{clinic.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {clinic.id}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" /> Managers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Clinic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.flatMap((user) =>
                  user.memberships
                    .filter(
                      (m: { role: { name: string } }) =>
                        m.role.name === "CLINIC_MANAGER",
                    )
                    .map(
                      (m: {
                        clinicId: any;
                        clinic: {
                          name:
                            | string
                            | number
                            | bigint
                            | boolean
                            | ReactElement<
                                unknown,
                                string | JSXElementConstructor<any>
                              >
                            | Iterable<ReactNode>
                            | ReactPortal
                            | Promise<
                                | string
                                | number
                                | bigint
                                | boolean
                                | ReactPortal
                                | ReactElement<
                                    unknown,
                                    string | JSXElementConstructor<any>
                                  >
                                | Iterable<ReactNode>
                                | null
                                | undefined
                              >
                            | null
                            | undefined;
                        };
                      }) => (
                        <TableRow key={`${user.id}-${m.clinicId}`}>
                          <TableCell>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {user.email}
                            </div>
                          </TableCell>
                          <TableCell>{m.clinic.name}</TableCell>
                        </TableRow>
                      ),
                    ),
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
