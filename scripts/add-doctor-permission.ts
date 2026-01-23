import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addDoctorPermission() {
  try {
    console.log("🔧 Adding doctor permission...");

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name: "role:doctor" },
    });

    if (existingPermission) {
      console.log("✅ Doctor permission already exists");
      return;
    }

    // Create the permission
    const permission = await prisma.permission.create({
      data: {
        name: "role:doctor",
        description: "Identifies user as a doctor who can provide consultations and manage appointments",
      },
    });

    console.log("✅ Doctor permission created:", permission.name);

    // Optionally, add this permission to an existing "Doctor" role if it exists
    const doctorRole = await prisma.role.findFirst({
      where: {
        name: {
          contains: "doctor",
          mode: "insensitive",
        },
      },
    });

    if (doctorRole) {
      await prisma.role.update({
        where: { id: doctorRole.id },
        data: {
          permissions: {
            connect: { id: permission.id },
          },
        },
      });
      console.log(`✅ Added doctor permission to role: ${doctorRole.name}`);
    } else {
      console.log("ℹ️  No 'Doctor' role found. You may need to manually assign this permission to doctor roles.");
    }

    console.log("\n✅ Done! Doctor permission has been added to the database.");
    console.log("\nNext steps:");
    console.log("1. Assign 'role:doctor' permission to doctor roles in your system");
    console.log("2. Update any API endpoints to use PERMISSIONS.IS_DOCTOR instead of 'appointment:write'");
  } catch (error) {
    console.error("❌ Error adding doctor permission:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addDoctorPermission();
