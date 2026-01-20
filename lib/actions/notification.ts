"use server";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const session = await getServerSession();
  if (!session?.user?.id) return [];

  return prisma.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
}

export async function markNotificationAsRead(id: string) {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.notification.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      read: true,
    },
  });

  revalidatePath("/");
}

export async function markAllNotificationsAsRead() {
  const session = await getServerSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.notification.updateMany({
    where: {
      userId: session.user.id,
      read: false,
    },
    data: {
      read: true,
    },
  });

  revalidatePath("/");
}

import { io as socketClient } from "socket.io-client";

const SOCKET_URL = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = "INFO",
  referenceId?: string,
  link?: string,
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
      referenceId,
    },
  });

  try {
    const socket = socketClient(SOCKET_URL);
    socket.emit("send-notification", { userId, notification });
    setTimeout(() => socket.close(), 1000);
  } catch (err) {
    console.error("Failed to emit socket event:", err);
  }

  return notification;
}
