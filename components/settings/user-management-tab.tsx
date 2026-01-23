"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, Crown, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMembersTable } from "@/components/team/team-members-table";
import { InvitationsTable } from "@/components/team/invitations-table";
import { InviteUserSheet } from "@/components/team/invite-user-sheet";
import { TransferOwnershipDialog } from "@/components/team/transfer-ownership-dialog";

interface Role {
  id: string;
  name: string;
  priority: number;
}

interface Member {
  id: string;
  userId: string;
  roleId: string;
  User: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  Role: Role;
  Clinic: {
    id: string;
    name: string;
  };
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  inviterId: string;
  Role: {
    id: string;
    name: string;
  };
}

interface Clinic {
  id: string;
  name: string;
  ownerId: string | null;
}

interface UserManagementTabProps {
  members: Member[];
  pendingInvitations: Invitation[];
  roles: Role[];
  clinic: Clinic | null;
  allClinics: Clinic[];
  currentUserId: string;
  currentUserRole?: Role;
  isOwner: boolean;
  canInvite: boolean;
  canManage: boolean;
  canTransferOwnership: boolean;
}

export function UserManagementTab({
  members,
  pendingInvitations,
  roles,
  clinic,
  allClinics,
  currentUserId,
  currentUserRole,
  isOwner,
  canInvite,
  canManage,
  canTransferOwnership,
}: UserManagementTabProps) {
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingInvitations.length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentUserRole?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOwner ? "Owner" : "Team Member"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {(canInvite || canTransferOwnership) && (
        <div className="flex gap-2 flex-wrap">
          {canInvite && (
            <Button onClick={() => setInviteSheetOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          )}
          
          {canTransferOwnership && (
            <Button
              variant="outline"
              onClick={() => setTransferDialogOpen(true)}
            >
              <Crown className="h-4 w-4 mr-2" />
              Transfer Ownership
            </Button>
          )}
        </div>
      )}

      {/* Team Members Section */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage roles and permissions for your team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamMembersTable
            members={members}
            roles={roles}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            isOwner={isOwner}
            ownerId={clinic?.ownerId || ""}
            canManage={canManage}
          />
        </CardContent>
      </Card>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              Users who have been invited but haven't accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InvitationsTable invitations={pendingInvitations} />
          </CardContent>
        </Card>
      )}

      {/* Invite User Sheet */}
      {canInvite && (
        <InviteUserSheet
          open={inviteSheetOpen}
          onOpenChange={setInviteSheetOpen}
          roles={roles}
          clinics={allClinics}
          currentUserRole={currentUserRole}
          defaultClinicId={clinic?.id}
        />
      )}

      {/* Transfer Ownership Dialog */}
      {canTransferOwnership && (
        <TransferOwnershipDialog
          open={transferDialogOpen}
          onOpenChange={setTransferDialogOpen}
          members={members.filter((m) => m.userId !== currentUserId)}
          clinicName={clinic?.name || ""}
        />
      )}
    </div>
  );
}
