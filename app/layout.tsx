import type { Metadata } from "next";
import { Inter } from "next/font/google";
import NextAuthSessionProvider from "@/components/session-provider";
import { cn } from "@/lib/utils";
import "./globals.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Kumacare (Clinic)",
  description: "Kumacare (Clinic) - Patient Management System",
  icons: {
    icon: [
      { url: "/favicon/light.png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon/dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={cn("overflow-x-clip antialiased")}>
        <NextAuthSessionProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
