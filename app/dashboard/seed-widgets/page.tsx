"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, X } from "lucide-react";

export default function SeedWidgetsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/seed/widgets", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to seed widgets");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Seed Prescription Widgets</CardTitle>
          <CardDescription>
            Initialize the database with 25 system widgets for the prescription layout editor.
            This includes common widgets and specialty-specific widgets for Dental, ENT, Pediatrics, Gynecology, and Cardiology.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Button
              onClick={handleSeed}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                "Seed Widgets"
              )}
            </Button>
          </div>

          {result && (
            <Card className="border-green-500 bg-green-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Success!</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Message:</strong> {result.message}</p>
                <p><strong>Created:</strong> {result.created} widgets</p>
                <p><strong>Skipped:</strong> {result.skipped} existing widgets</p>
                <p><strong>Total:</strong> {result.total} widgets</p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-500 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-800">Error</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Widget Categories:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>8 Common Widgets (Vitals, Complaints, Diagnosis, etc.)</li>
              <li>4 Dental Widgets (Chart, Examination, Treatment, Hygiene)</li>
              <li>4 ENT Widgets (Ear, Nose, Throat, Audiometry)</li>
              <li>3 Pediatrics Widgets (Growth, Immunization, Milestones)</li>
              <li>3 Gynecology Widgets (Menstrual, Pregnancy, Ultrasound)</li>
              <li>3 Cardiology Widgets (ECG, Echo, Stress Test)</li>
            </ul>
          </div>

          {result && result.created > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Widgets seeded successfully! You can now:
              </p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.href = "/dashboard/prescription-layout"}
                >
                  Open Layout Editor
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
