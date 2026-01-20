"use client";

import { activeClinicIdAtom, useActiveClinic, useClinics } from "@/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { Check, ChevronsUpDown, CircleDashed, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// TODO: Implement setDefaultClinic
// import { setDefaultClinic } from "@/actions/clinic";

export function ClinicSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [clinics] = useClinics();
  const activeClinic = useActiveClinic();
  const [activeClinicId, setActiveClinicId] = useAtom(activeClinicIdAtom);

  const isManager =
    session?.user?.role === "CLINIC_MANAGER" || session?.user?.role === "ADMIN";

  const onSwitch = async (clinicId: string) => {
    setActiveClinicId(clinicId);
    await update({ activeClinicId: clinicId });
    router.refresh();
  };

  const onSetDefault = async (clinicId: string) => {
    // await setDefaultClinic(clinicId);
    await update({ activeClinicId: clinicId });
    router.refresh();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-clip rounded-lg">
                <Image
                  src={"/icon/light.png"}
                  alt="Clinic"
                  width={32}
                  height={32}
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeClinic?.name || "Select Clinic"}
                </span>
                <span className="truncate text-xs">
                  {activeClinic?.role || "Membership"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Clinics
            </DropdownMenuLabel>
            {clinics.map((clinic) => (
              <div key={clinic.id} className="flex items-center gap-1">
                <DropdownMenuItem
                  onClick={() => onSwitch(clinic.id)}
                  className="flex-1 gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center">
                    <CircleDashed className="size-4 shrink-0" />
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <span>{clinic.name}</span>
                    {activeClinicId === clinic.id && (
                      <Check className="size-4" />
                    )}
                  </div>
                </DropdownMenuItem>
                {isManager && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDefault(clinic.id);
                    }}
                    title="Set as Default"
                  >
                    <Plus
                      className={cn(
                        "h-4 w-4",
                        session?.user?.defaultClinicId === clinic.id &&
                          "text-primary",
                      )}
                    />
                  </Button>
                )}
              </div>
            ))}
            {isManager && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={() => router.push("/register-clinic")}
                >
                  <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Add clinic
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
