import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardView from "@/components/dashboard-view";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAllNotificationsAsRead } from "@/lib/actions/notification";
import { redirect } from "next/navigation";

async function getNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Limit to last 50 notifications
  });
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const notifications = await getNotifications(session.user.id);

  return (
    <DashboardView
      title="Notifications"
      actions={
        <form action={markAllNotificationsAsRead}>
          <Button variant="outline" size="sm">
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </form>
      }
    >
      <div className="mx-auto max-w-4xl space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground flex flex-col items-center justify-center py-12">
              <Bell className="mb-4 h-12 w-12 opacity-20" />
              <p>You have no notifications yet.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={
                notification.read
                  ? "bg-background"
                  : "bg-muted/30 border-primary/20"
              }
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div
                  className={`mt-1 rounded-full p-2 ${notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}
                >
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <h4
                      className={`text-sm font-medium ${!notification.read && "text-foreground"}`}
                    >
                      {notification.title}
                    </h4>
                    <span className="text-muted-foreground ml-2 text-xs whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleDateString()} at{" "}
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {notification.message}
                  </p>
                  {!notification.read && (
                    <Badge variant="secondary" className="mt-2 h-5 text-[10px]">
                      New
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardView>
  );
}
