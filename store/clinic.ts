"use client";

import { atom, useAtom, useSetAtom } from "jotai";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { Clinic } from "@prisma/client";

type ClinicWithRole = Clinic & { role: string };

export const activeClinicIdAtom = atom<string | undefined>(undefined);
export const clinicsAtom = atom<ClinicWithRole[]>([]);

export const useInitializeClinicData = () => {
  const { data: session } = useSession();
  const setClinics = useSetAtom(clinicsAtom);
  const setActiveClinicId = useSetAtom(activeClinicIdAtom);

  useEffect(() => {
    if (session?.user) {
      setClinics(session.user.clinics || []);
      setActiveClinicId(session.user.activeClinicId);
    }
  }, [session?.user, setClinics, setActiveClinicId]);
};

export const useClinics = () => useAtom(clinicsAtom);
export const useActiveClinic = () => {
  const [clinics] = useClinics();
  const [activeClinicId] = useAtom(activeClinicIdAtom);
  return clinics.find((c) => c.id === activeClinicId);
};
