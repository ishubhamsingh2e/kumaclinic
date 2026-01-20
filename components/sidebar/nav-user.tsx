"use client";

import {
  Bell,
  ChevronsUpDown,
  LogOut,
  Sparkles,
  Settings,
  Shield,
  Users,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
    title?: string | null;
  };
}) {
  const { isMobile } = useSidebar();
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();

  const canReadUsers = hasPermission(PERMISSIONS.USER_READ);
  const canReadRoles = hasPermission(PERMISSIONS.ROLE_READ);

  const displayName = [user.title, user.name].filter(Boolean).join(" ");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.avatar || ""} alt={user.name} />
                <AvatarFallback className="rounded-full">
                  {displayName.charAt(0) + displayName.charAt(1)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || ""} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {displayName.charAt(0) + displayName.charAt(1)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/notifications">
                  <Bell />
                  Notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {(canReadUsers || canReadRoles) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
                    Admin
                  </DropdownMenuLabel>
                  {canReadUsers && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/users">
                        <Users />
                        User Management
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {canReadRoles && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin/roles">
                        <LockKeyhole />
                        Roles & Permissions
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {canReadUsers && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Sparkles />
              Upgrade to Pro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
