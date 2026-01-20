import { prisma } from "@/lib/db";
import { PERMISSIONS } from "../lib/permissions";
import { ROLES } from "../lib/rbac";
import bcrypt from "bcryptjs";
import "dotenv/config";

async function main() {
  // Create Permissions
  const permissions = await Promise.all(
    Object.values(PERMISSIONS).map((p) =>
      prisma.permission.upsert({
        where: { name: p },
        update: {},
        create: { name: p },
      }),
    ),
  );

  // Create Roles and associate permissions
  for (const roleName in ROLES) {
    const rolePermissions = ROLES[roleName as keyof typeof ROLES];
    await prisma.role.upsert({
      where: { name: roleName },
      update: {
        permissions: {
          set: [], // Clear existing relations to re-connect all
          connect: rolePermissions.map((p) => ({ name: p })),
        },
      },
      create: {
        name: roleName,
        permissions: {
          connect: rolePermissions.map((p) => ({ name: p })),
        },
      },
    });
  }

  // Create a default admin user if env vars are set
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminName && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });
    if (!adminRole) {
      throw new Error("ADMIN role not found. Make sure to seed roles first.");
    }
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        title: "Admin",
      },
    });

    const defaultClinic = await prisma.clinic.upsert({
      where: { id: "default-clinic" },
      update: {},
      create: {
        id: "default-clinic",
        name: "Default Clinic",
      },
    });

    await prisma.clinicMember.upsert({
      where: {
        userId_clinicId: {
          userId: user.id,
          clinicId: defaultClinic.id,
        },
      },
      update: {
        roleId: adminRole.id,
      },
      create: {
        userId: user.id,
        clinicId: defaultClinic.id,
        roleId: adminRole.id,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { defaultClinicId: defaultClinic.id },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
