import NextAuth from "next-auth";
import { Clinic } from "@prisma/client";

type ClinicWithRole = Clinic & { role: string };

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      title: string | null;
      image: string | null;
      permissions: string[] | null;
      clinics: ClinicWithRole[];
      activeClinicId: string | null;
      defaultClinicId: string | null;
      role: string;
    } & NextAuth.DefaultSession["user"];
  }

  interface User {
    title: string | null;
    image: string | null;
    permissions: string[] | null;
    clinics: ClinicWithRole[];
    activeClinicId: string | null;
    defaultClinicId: string |null;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    title: string | null;
    image: string | null;
    permissions: string[] | null;
    clinics: ClinicWithRole[];
    activeClinicId: string | null;
    defaultClinicId: string | null;
    role: string;
  }
}
