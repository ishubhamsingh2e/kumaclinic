"use client";

import React, { useEffect } from "react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Eye,
  Ban,
  Users,
  Building2,
  UserCheck,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  title: string | null;
  phone: string | null;
  address: string | null;
  dob: Date | null;
  licenseNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  memberships: {
    id: string;
    Clinic: {
      id: string;
      name: string;
      slug: string | null;
    };
    Role: {
      id: string;
      name: string;
    };
  }[];
}

interface UserManagementClientProps {
  users: User[];
  totalCount: number;
  totalUsers: number;
  usersWithClinics: number;
  usersWithoutClinics: number;
}

export default function UserManagementClient({
  users,
  totalCount,
  totalUsers,
  usersWithClinics,
  usersWithoutClinics,
}: UserManagementClientProps) {
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({ shallow: false }),
  );
  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false }),
  );
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (searchQuery) {
      setCurrentPage(1);
    }
  }, [searchQuery, setCurrentPage]);

  // Pagination calculations
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const handleBanUser = async (userId: string, banned: boolean) => {
    try {
      const response = await fetch("/api/admin/users/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, banned }),
      });

      if (!response.ok) throw new Error("Failed to update user status");

      toast.success(
        banned ? "User banned successfully" : "User unbanned successfully",
      );
    } catch (error) {
      toast.error("Failed to update user status");
      console.error(error);
    }
  };

  const openUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Users with Clinics
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithClinics}</div>
            <p className="text-xs text-muted-foreground">
              Active clinic members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Users without Clinics
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersWithoutClinics}</div>
            <p className="text-xs text-muted-foreground">Pending assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}

      <h1>All Users</h1>
      <div className="flex items-center gap-2 mt-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 w-80"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Showing {startIndex + 1}-
        {Math.min(startIndex + users.length, totalCount)} of {totalCount} users
        {searchQuery && ` (filtered from ${totalUsers} total)`}
      </p>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Clinics</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground"
              >
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">
                    {user.title} {user.name || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{user.email || "N/A"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{user.phone || "N/A"}</div>
                </TableCell>
                <TableCell>
                  {user.memberships.length === 0 ? (
                    <Badge variant="secondary">No Clinic</Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.memberships.map((membership) => (
                        <Badge key={membership.id} variant="outline">
                          {membership.Clinic.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {user.memberships.length === 0 ? (
                    <Badge variant="secondary">No Role</Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.memberships.map((membership) => (
                        <Badge key={membership.id} variant="default">
                          {membership.Role.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => openUserDetails(user)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => handleBanUser(user.id, true)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Ban User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPage(currentPage - 1);
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        goToPage(page as number);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    goToPage(currentPage + 1);
                  }}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* User Details Sheet */}
      <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <SheetContent
          side="right"
          className="overflow-y-auto w-full sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              Complete information about the user
            </SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="space-y-6 mt-6 p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <p className="text-sm mt-1">
                    {selectedUser.title} {selectedUser.name || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-sm mt-1">{selectedUser.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <p className="text-sm mt-1">{selectedUser.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    License Number
                  </label>
                  <p className="text-sm mt-1">
                    {selectedUser.licenseNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date of Birth
                  </label>
                  <p className="text-sm mt-1">
                    {selectedUser.dob
                      ? format(new Date(selectedUser.dob), "MMM d, yyyy")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Address
                  </label>
                  <p className="text-sm mt-1">
                    {selectedUser.address || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    User ID
                  </label>
                  <p className="text-sm font-mono mt-1">{selectedUser.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Account Created
                  </label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedUser.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="text-sm mt-1">
                    {format(new Date(selectedUser.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Clinic Memberships
                </label>
                {selectedUser.memberships.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No clinic memberships
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedUser.memberships.map((membership) => (
                      <Card key={membership.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {membership.Clinic.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Role: {membership.Role.name}
                              </p>
                              {membership.Clinic.slug && (
                                <p className="text-xs text-muted-foreground">
                                  Slug: {membership.Clinic.slug}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline">Active</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
