"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { authOptions } from "../auth";

export async function getApiKeys() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.activeClinicId) {
    return { error: "No active clinic found" };
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { clinicId: session.user.activeClinicId },
    orderBy: { createdAt: "desc" },
  });

  return { apiKeys };
}

export async function generateApiKey() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.activeClinicId) {
    return { error: "No active clinic found" };
  }

  const newKey = `sk_${nanoid(32)}`;
  const apiKey = await prisma.apiKey.create({
    data: {
      key: newKey,
      clinicId: session.user.activeClinicId,
    },
  });

  revalidatePath("/dashboard/settings");
  return { apiKey: apiKey.key };
}

export async function deleteApiKey(apiKeyId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.activeClinicId) {
    return { error: "No active clinic found" };
  }

  const key = await prisma.apiKey.findUnique({
    where: { id: apiKeyId },
  });

  if (!key || key.clinicId !== session.user.activeClinicId) {
    return { error: "API key not found or you do not have permission" };
  }

  await prisma.apiKey.delete({
    where: { id: apiKeyId },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
}
