/**
 * Migration script to move DoctorWidget data to User.prescriptionLayout JSON field
 * Run with: npx tsx scripts/migrate-layout-to-json.ts
 */

import { prisma } from "../lib/db";

async function migrateLayoutToJson() {
  console.log("Starting migration of DoctorWidget to prescriptionLayout...");

  try {
    // Get all doctor widgets grouped by doctorId
    const doctorWidgets = await prisma.doctorWidget.findMany({
      include: {
        Widget: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    // Group by doctorId
    const widgetsByDoctor = new Map<string, any[]>();
    for (const dw of doctorWidgets) {
      if (!widgetsByDoctor.has(dw.doctorId)) {
        widgetsByDoctor.set(dw.doctorId, []);
      }
      widgetsByDoctor.get(dw.doctorId)!.push(dw);
    }

    console.log(`Found ${widgetsByDoctor.size} doctors with custom layouts`);

    // Migrate each doctor's layout
    let migratedCount = 0;
    for (const [doctorId, widgets] of widgetsByDoctor.entries()) {
      const layout = {
        widgets: widgets.map((w) => ({
          widgetId: w.widgetId,
          position: w.position,
          visible: w.visible,
          width: w.width,
          columnSpan: 6, // Default to 6 columns for existing widgets
          config: w.config,
        })),
        migratedAt: new Date().toISOString(),
      };

      await prisma.user.update({
        where: { id: doctorId },
        data: { prescriptionLayout: layout },
      });

      migratedCount++;
      console.log(
        `Migrated ${widgets.length} widgets for doctor ${doctorId}`,
      );
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   - ${migratedCount} doctors migrated`);
    console.log(
      `   - ${doctorWidgets.length} total widget configurations migrated`,
    );
    console.log(
      `\n⚠️  Old DoctorWidget records are still in the database.`,
    );
    console.log(`   You can delete them manually if needed.`);
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateLayoutToJson()
  .then(() => {
    console.log("\nMigration script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration script failed:", error);
    process.exit(1);
  });
