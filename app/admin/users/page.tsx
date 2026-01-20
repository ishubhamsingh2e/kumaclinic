import DashboardView from "@/components/dashboard-view";
import { prisma } from "@/lib/db";
import UserManagementClient from "@/components/admin/user-management-client";

interface SearchParams {
  search?: string;
  page?: string;
}

async function getUsers(search?: string, page: number = 1) {
  const ITEMS_PER_PAGE = 10;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        memberships: {
          include: {
            Clinic: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            Role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, totalCount };
}

async function getTotalStats() {
  const [totalUsers, usersWithClinics] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: {
        memberships: {
          some: {},
        },
      },
    }),
  ]);

  return {
    totalUsers,
    usersWithClinics,
    usersWithoutClinics: totalUsers - usersWithClinics,
  };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");

  const [{ users, totalCount }, stats] = await Promise.all([
    getUsers(search, page),
    getTotalStats(),
  ]);

  return (
    <DashboardView title="User Management">
      <UserManagementClient
        users={users}
        totalCount={totalCount}
        totalUsers={stats.totalUsers}
        usersWithClinics={stats.usersWithClinics}
        usersWithoutClinics={stats.usersWithoutClinics}
      />
    </DashboardView>
  );
}
