import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create a new connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Set to true if your PostgreSQL server requires SSL
  max: 5, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Common widgets available to all specialties
const commonWidgets = [
  {
    name: "Vitals",
    type: "system",
    componentName: "VitalsWidget",
    specialty: null,
    description:
      "Record patient vitals: BP, Pulse, Temperature, Height, Weight, SpO2",
    defaultWidth: "full",
    icon: "Activity",
  },
  {
    name: "Complaints",
    type: "system",
    componentName: "ComplaintsWidget",
    specialty: null,
    description: "Chief complaints and present illness",
    defaultWidth: "full",
    icon: "FileText",
  },
  {
    name: "Diagnosis",
    type: "system",
    componentName: "DiagnosisWidget",
    specialty: null,
    description: "Diagnosis with ICD codes",
    defaultWidth: "full",
    icon: "Stethoscope",
  },
  {
    name: "Prescription",
    type: "system",
    componentName: "PrescriptionWidget",
    specialty: null,
    description: "Medicine prescription",
    defaultWidth: "full",
    icon: "Pill",
  },
  {
    name: "Advice",
    type: "system",
    componentName: "AdviceWidget",
    specialty: null,
    description: "Post-consultation advice and instructions",
    defaultWidth: "full",
    icon: "MessageSquare",
  },
  {
    name: "Follow-up",
    type: "system",
    componentName: "FollowUpWidget",
    specialty: null,
    description: "Next visit date and follow-up instructions",
    defaultWidth: "half",
    icon: "Calendar",
  },
  {
    name: "Lab Orders",
    type: "system",
    componentName: "LabOrdersWidget",
    specialty: null,
    description: "Laboratory tests and investigations",
    defaultWidth: "full",
    icon: "TestTube",
  },
  {
    name: "Notes",
    type: "system",
    componentName: "NotesWidget",
    specialty: null,
    description: "Private doctor notes (not visible to patient)",
    defaultWidth: "full",
    icon: "StickyNote",
  },
];

// Dental specialty widgets
const dentalWidgets = [
  {
    name: "Dental Chart",
    type: "system",
    componentName: "DentalChartWidget",
    specialty: "DENTAL",
    description: "Interactive dental chart for tooth examination",
    defaultWidth: "full",
    icon: "Clipboard",
  },
  {
    name: "Tooth Examination",
    type: "system",
    componentName: "ToothExaminationWidget",
    specialty: "DENTAL",
    description: "Detailed examination of specific teeth",
    defaultWidth: "full",
    icon: "Search",
  },
  {
    name: "Treatment Plan",
    type: "system",
    componentName: "TreatmentPlanWidget",
    specialty: "DENTAL",
    description: "Planned dental treatments and procedures",
    defaultWidth: "full",
    icon: "ClipboardList",
  },
  {
    name: "Oral Hygiene",
    type: "system",
    componentName: "OralHygieneWidget",
    specialty: "DENTAL",
    description: "Oral hygiene instructions and tips",
    defaultWidth: "half",
    icon: "Sparkles",
  },
];

// ENT specialty widgets
const entWidgets = [
  {
    name: "Ear Examination",
    type: "system",
    componentName: "EarExaminationWidget",
    specialty: "ENT",
    description: "Ear examination findings",
    defaultWidth: "half",
    icon: "Ear",
  },
  {
    name: "Nose Examination",
    type: "system",
    componentName: "NoseExaminationWidget",
    specialty: "ENT",
    description: "Nose and sinus examination",
    defaultWidth: "half",
    icon: "Wind",
  },
  {
    name: "Throat Examination",
    type: "system",
    componentName: "ThroatExaminationWidget",
    specialty: "ENT",
    description: "Throat and pharynx examination",
    defaultWidth: "half",
    icon: "Circle",
  },
  {
    name: "Audiometry",
    type: "system",
    componentName: "AudiometryWidget",
    specialty: "ENT",
    description: "Hearing test results",
    defaultWidth: "half",
    icon: "Volume2",
  },
];

// Pediatrics specialty widgets
const pediatricsWidgets = [
  {
    name: "Growth Chart",
    type: "system",
    componentName: "GrowthChartWidget",
    specialty: "PEDIATRICS",
    description: "Child growth tracking (height, weight, head circumference)",
    defaultWidth: "full",
    icon: "TrendingUp",
  },
  {
    name: "Immunization",
    type: "system",
    componentName: "ImmunizationWidget",
    specialty: "PEDIATRICS",
    description: "Vaccination history and schedule",
    defaultWidth: "full",
    icon: "Syringe",
  },
  {
    name: "Developmental Milestones",
    type: "system",
    componentName: "DevelopmentalMilestonesWidget",
    specialty: "PEDIATRICS",
    description: "Child development tracking",
    defaultWidth: "full",
    icon: "Baby",
  },
];

// Gynecology specialty widgets
const gynecologyWidgets = [
  {
    name: "Menstrual History",
    type: "system",
    componentName: "MenstrualHistoryWidget",
    specialty: "GYNECOLOGY",
    description: "Menstrual cycle details",
    defaultWidth: "half",
    icon: "Calendar",
  },
  {
    name: "Pregnancy Details",
    type: "system",
    componentName: "PregnancyDetailsWidget",
    specialty: "GYNECOLOGY",
    description: "Pregnancy information and tracking",
    defaultWidth: "full",
    icon: "Heart",
  },
  {
    name: "Ultrasound Findings",
    type: "system",
    componentName: "UltrasoundWidget",
    specialty: "GYNECOLOGY",
    description: "USG and imaging findings",
    defaultWidth: "full",
    icon: "Scan",
  },
];

// Cardiology specialty widgets
const cardiologyWidgets = [
  {
    name: "ECG Findings",
    type: "system",
    componentName: "ECGWidget",
    specialty: "CARDIOLOGY",
    description: "Electrocardiogram results",
    defaultWidth: "full",
    icon: "Activity",
  },
  {
    name: "Echo Results",
    type: "system",
    componentName: "EchoWidget",
    specialty: "CARDIOLOGY",
    description: "Echocardiography findings",
    defaultWidth: "full",
    icon: "Heart",
  },
  {
    name: "Stress Test",
    type: "system",
    componentName: "StressTestWidget",
    specialty: "CARDIOLOGY",
    description: "Cardiac stress test results",
    defaultWidth: "full",
    icon: "Zap",
  },
];

async function main() {
  console.log("🌱 Seeding widgets...");
  console.log(`📡 Connecting to database: ${process.env.DATABASE_URL?.split('@')[1] || 'unknown'}`);

  // Test database connection
  try {
    await prisma.$connect();
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    throw error;
  }

  // Combine all widgets
  const allWidgets = [
    ...commonWidgets,
    ...dentalWidgets,
    ...entWidgets,
    ...pediatricsWidgets,
    ...gynecologyWidgets,
    ...cardiologyWidgets,
  ];

  // Create widgets
  let created = 0;
  let skipped = 0;

  for (const widget of allWidgets) {
    try {
      const existing = await prisma.widget.findFirst({
        where: {
          name: widget.name,
          specialty: widget.specialty,
        },
      });

      if (existing) {
        console.log(`⏭️  Skipping existing widget: ${widget.name}`);
        skipped++;
        continue;
      }

      await prisma.widget.create({
        data: widget,
      });

      console.log(
        `✅ Created widget: ${widget.name} (${widget.specialty || "Common"})`,
      );
      created++;
    } catch (error) {
      console.error(`❌ Error creating widget ${widget.name}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Created: ${created} widgets`);
  console.log(`   Skipped: ${skipped} widgets`);
  console.log(`   Total: ${allWidgets.length} widgets`);
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
