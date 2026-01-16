"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getNotifications, markAllNotificationsAsRead } from "@/lib/actions/notification";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { socket } from "@/lib/socket";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: Date;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    const data = await getNotifications();
    setNotifications(data);
    const unread = data.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, []);

  useEffect(() => {
    fetchNotifications();

    if (session?.user?.id) {
      socket.connect();
      
      socket.on("connect", () => {
        socket.emit("join-room", session.user.id);
      });

      socket.on("new-notification", (notification: Notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info(notification.title, {
          description: notification.message,
        });
      });

      return () => {
        socket.off("connect");
        socket.off("new-notification");
        socket.disconnect();
      };
    }
  }, [session?.user?.id, fetchNotifications]);

  const handleOpenChange = async (open: boolean) => {
// ...
    setIsOpen(open);
    if (open && unreadCount > 0) {
      await markAllNotificationsAsRead();
      setUnreadCount(0);
      // Optimistically update read status
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <h4 className="leading-none font-semibold">Notifications</h4>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-sm">
              No notifications
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`hover:bg-muted/50 flex flex-col gap-1 border-b p-4 transition-colors last:border-0 ${
                    !notification.read ? "bg-muted/20" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">
                      {notification.title}
                    </span>
                    <span className="text-muted-foreground text-[10px] whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="bg-muted/20 border-t p-2">
          <Button
            variant="ghost"
            className="h-8 w-full text-xs"
            onClick={() => {
              setIsOpen(false);
              router.push("/dashboard/notifications");
            }}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
