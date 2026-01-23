"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  GitBranch,
  Pencil,
} from "lucide-react";
import { AddClinicSheet } from "./add-clinic-sheet";
import { EditClinicSheet } from "./edit-clinic-sheet";

interface Clinic {
  id: string;
  name: string;
  bio: string | null;
  coverImage: string | null;
  profileImage: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  googleMapsUrl: string | null;
  instagram: string | null;
  facebook: string | null;
  twitter: string | null;
  linkedin: string | null;
  googleReviewsUrl: string | null;
  isBranch: boolean;
  parentClinicId: string | null;
  ClinicMember: Array<{
    Role: {
      name: string;
    };
  }>;
}

interface ClinicsListProps {
  clinics: Clinic[];
}

export function ClinicsList({ clinics }: ClinicsListProps) {
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Clinics</h2>
          <p className="text-muted-foreground">
            Manage your clinic locations and settings
          </p>
        </div>
        <AddClinicSheet allClinics={clinics} />
      </div>

      {clinics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clinics yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Get started by creating your first clinic location
            </p>
            <AddClinicSheet allClinics={clinics} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clinics.map((clinic) => (
            <Card
              key={clinic.id}
              className="hover:shadow-lg transition-shadow relative"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{clinic.name}</CardTitle>
                  <div className="flex justify-center items-center gap-2">
                    {clinic.isBranch && (
                      <Badge variant="outline" className="gap-1">
                        <GitBranch className="h-3 w-3" />
                        Branch
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingClinic(clinic)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-3">
                {(clinic.address || clinic.city || clinic.state) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">
                      {[clinic.address, clinic.city, clinic.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {clinic.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {clinic.phone}
                    </span>
                  </div>
                )}
                {clinic.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {clinic.email}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Clinic Sheet */}
      {editingClinic && (
        <EditClinicSheet
          clinic={editingClinic}
          open={!!editingClinic}
          onOpenChange={(open) => !open && setEditingClinic(null)}
          allClinics={clinics}
        />
      )}
    </div>
  );
}
