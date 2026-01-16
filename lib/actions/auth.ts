"use server";

import { signIn, signOut } from "@/lib/auth";

export async function login(
  provider: "google" | "apple" | "credentials",
  credentials?: { email: string; password: string },
) {
  if (provider === "credentials" && credentials) {
    await signIn("credentials", {
      redirect: true,
      email: credentials.email,
      password: credentials.password,
    });
  } else {
    await signIn(provider, { redirect: false });
  }
}

export async function logout(provider: string) {
  await signOut({ redirect: true });
}
