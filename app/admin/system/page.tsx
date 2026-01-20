import DashboardView from "@/components/dashboard-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export default function AdminSystemPage() {
  return (
    <DashboardView title="System Settings" subtitle="Configure global system settings">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
            <CardDescription>Database connection information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Connected</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Database is operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Version</CardTitle>
            <CardDescription>Current application version</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-base">
              v1.0.0
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              Latest stable release
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Current environment configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="default">
              {process.env.NODE_ENV || "development"}
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              Running environment mode
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Security settings and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">HTTPS Enabled</span>
                <Badge variant="outline">Yes</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rate Limiting</span>
                <Badge variant="outline">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Enable maintenance mode to prevent user access during updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Maintenance mode is currently disabled. All users have normal access
            to the system.
          </p>
        </CardContent>
      </Card>
    </DashboardView>
  );
}
