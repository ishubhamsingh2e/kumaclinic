import { PatientRegistrationForm } from "@/components/forms/patient-registration-form";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import DashboardView from "@/components/dashboard-view";

export default function NewPatientPage() {
  return (
    <DashboardView title="New Patient">
      <div className="flex-1 space-y-4">
        <Card>
          <CardContent>
            <PatientRegistrationForm />
          </CardContent>
        </Card>
      </div>
    </DashboardView>
  );
}
