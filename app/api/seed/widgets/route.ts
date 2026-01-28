import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// All 25 system widgets definition
const allWidgets = [
  // Common Widgets (8)
  {
    name: "Vitals",
    type: "system",
    componentName: "VitalsWidget",
    description: "Record patient vitals like BP, pulse, temperature, etc.",
    icon: "Activity",
    specialty: null,
  },
  {
    name: "Complaints",
    type: "system",
    componentName: "ComplaintsWidget",
    description: "Patient's chief complaints and presenting symptoms",
    icon: "MessageSquare",
    specialty: null,
  },
  {
    name: "Diagnosis",
    type: "system",
    componentName: "DiagnosisWidget",
    description: "Clinical diagnosis with ICD codes",
    icon: "Stethoscope",
    specialty: null,
  },
  {
    name: "Prescription",
    type: "system",
    componentName: "PrescriptionWidget",
    description: "Medications and prescriptions",
    icon: "Pill",
    specialty: null,
  },
  {
    name: "Advice",
    type: "system",
    componentName: "AdviceWidget",
    description: "General advice, dietary recommendations, and restrictions",
    icon: "Lightbulb",
    specialty: null,
  },
  {
    name: "Follow-up",
    type: "system",
    componentName: "FollowUpWidget",
    description: "Next visit schedule and follow-up instructions",
    icon: "Calendar",
    specialty: null,
  },
  {
    name: "Lab Orders",
    type: "system",
    componentName: "LabOrdersWidget",
    description: "Laboratory tests and investigations",
    icon: "FlaskConical",
    specialty: null,
  },
  {
    name: "Notes",
    type: "system",
    componentName: "NotesWidget",
    description: "Private doctor notes (not visible to patient)",
    icon: "FileText",
    specialty: null,
  },

  // Dental Widgets (4)
  {
    name: "Dental Chart",
    type: "system",
    componentName: "DentalChartWidget",
    description: "Visual tooth chart with annotations",
    icon: "Smile",
    specialty: "DENTAL",
  },
  {
    name: "Tooth Examination",
    type: "system",
    componentName: "ToothExaminationWidget",
    description: "Detailed tooth-by-tooth examination",
    icon: "Search",
    specialty: "DENTAL",
  },
  {
    name: "Treatment Plan",
    type: "system",
    componentName: "TreatmentPlanWidget",
    description: "Dental treatment plan and procedures",
    icon: "ClipboardList",
    specialty: "DENTAL",
  },
  {
    name: "Oral Hygiene",
    type: "system",
    componentName: "OralHygieneWidget",
    description: "Oral hygiene assessment and instructions",
    icon: "Droplet",
    specialty: "DENTAL",
  },

  // ENT Widgets (4)
  {
    name: "Ear Examination",
    type: "system",
    componentName: "EarExaminationWidget",
    description: "Otoscopic examination findings",
    icon: "Ear",
    specialty: "ENT",
  },
  {
    name: "Nose Examination",
    type: "system",
    componentName: "NoseExaminationWidget",
    description: "Nasal examination and findings",
    icon: "Wind",
    specialty: "ENT",
  },
  {
    name: "Throat Examination",
    type: "system",
    componentName: "ThroatExaminationWidget",
    description: "Throat and pharynx examination",
    icon: "Mic",
    specialty: "ENT",
  },
  {
    name: "Audiometry",
    type: "system",
    componentName: "AudiometryWidget",
    description: "Hearing test results",
    icon: "Volume2",
    specialty: "ENT",
  },

  // Pediatrics Widgets (3)
  {
    name: "Growth Chart",
    type: "system",
    componentName: "GrowthChartWidget",
    description: "Child growth tracking (height, weight, BMI percentiles)",
    icon: "TrendingUp",
    specialty: "PEDIATRICS",
  },
  {
    name: "Immunization",
    type: "system",
    componentName: "ImmunizationWidget",
    description: "Vaccination schedule and records",
    icon: "Syringe",
    specialty: "PEDIATRICS",
  },
  {
    name: "Developmental Milestones",
    type: "system",
    componentName: "DevelopmentalMilestonesWidget",
    description: "Child development assessment",
    icon: "Baby",
    specialty: "PEDIATRICS",
  },

  // Gynecology Widgets (3)
  {
    name: "Menstrual History",
    type: "system",
    componentName: "MenstrualHistoryWidget",
    description: "Menstrual cycle and history",
    icon: "Calendar",
    specialty: "GYNECOLOGY",
  },
  {
    name: "Pregnancy Details",
    type: "system",
    componentName: "PregnancyDetailsWidget",
    description: "Antenatal care and pregnancy tracking",
    icon: "Baby",
    specialty: "GYNECOLOGY",
  },
  {
    name: "Ultrasound Findings",
    type: "system",
    componentName: "UltrasoundFindingsWidget",
    description: "Obstetric ultrasound results",
    icon: "Scan",
    specialty: "GYNECOLOGY",
  },

  // Cardiology Widgets (3)
  {
    name: "ECG Findings",
    type: "system",
    componentName: "ECGFindingsWidget",
    description: "Electrocardiogram results",
    icon: "Activity",
    specialty: "CARDIOLOGY",
  },
  {
    name: "Echo Results",
    type: "system",
    componentName: "EchoResultsWidget",
    description: "Echocardiography findings",
    icon: "Heart",
    specialty: "CARDIOLOGY",
  },
  {
    name: "Stress Test",
    type: "system",
    componentName: "StressTestWidget",
    description: "Cardiac stress test results",
    icon: "Activity",
    specialty: "CARDIOLOGY",
  },
];

export async function POST(request: NextRequest) {
  try {
    let created = 0;
    let skipped = 0;

    for (const widget of allWidgets) {
      // Check if widget already exists
      const existing = await prisma.widget.findFirst({
        where: {
          name: widget.name,
          type: widget.type,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create widget
      await prisma.widget.create({
        data: widget,
      });

      created++;
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${created} widgets, skipped ${skipped} existing`,
      created,
      skipped,
      total: allWidgets.length,
    });
  } catch (error) {
    console.error("Error seeding widgets:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
