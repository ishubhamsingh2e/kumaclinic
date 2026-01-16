import { prisma } from "@/lib/db";
import { PERMISSIONS } from "../lib/permissions";
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
  const superAdminRole = await prisma.role.upsert({
    where: { name: "SUPER_ADMIN" },
    update: {
      permissions: {
        set: [], // Clear existing relations to re-connect all
        connect: permissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: "SUPER_ADMIN",
      permissions: { connect: permissions.map((p) => ({ id: p.id })) }, // Super admin gets all permissions
    },
  });

  await prisma.role.upsert({
    where: { name: "CLINIC_MANAGER" },
    update: {},
    create: {
      name: "CLINIC_MANAGER",
      permissions: {
        connect: [
          { name: PERMISSIONS.USER_MANAGE },
          { name: PERMISSIONS.PATIENT_CREATE },
          { name: PERMISSIONS.PATIENT_VIEW_ALL },
        ],
      },
    },
  });

  await prisma.role.upsert({
    where: { name: "DOCTOR" },
    update: {},
    create: {
      name: "DOCTOR",
      permissions: {
        connect: [
          { name: PERMISSIONS.PATIENT_CREATE },
          { name: PERMISSIONS.PATIENT_VIEW_ALL },
        ],
      },
    },
  });

  // Create a default super admin user if env vars are set
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminName = process.env.SUPER_ADMIN_NAME;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (adminEmail && adminName && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
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
        roleId: superAdminRole.id,
      },
      create: {
        userId: user.id,
        clinicId: defaultClinic.id,
        roleId: superAdminRole.id,
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
