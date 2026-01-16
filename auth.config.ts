import { PERMISSIONS } from "@/lib/permissions";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Define public routes
      const isPublicRoute = 
        pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/register-clinic") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password") ||
        pathname.startsWith("/c/"); // Public clinic profiles

      if (isPublicRoute) {
        if (isLoggedIn && !pathname.startsWith("/c/")) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false; // Redirect to login
      }

      // Admin route protection
      if (pathname.startsWith("/admin")) {
        const userPermissions = (auth.user as any).permissions ?? [];
        return userPermissions.includes(PERMISSIONS.CLINIC_OWNER_MANAGE);
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
