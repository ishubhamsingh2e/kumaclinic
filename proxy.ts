import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

// Paths that should be logged
const LOGGED_PATHS = ["/api", "/dashboard"];

// Paths to skip logging (too noisy)
const SKIP_PATHS = [
  "/api/auth",
  "/_next",
  "/static",
  "/favicon.ico",
  "/api/upload", // Skip file uploads
];

export default withAuth(
  async function middleware(req) {
    const startTime = Date.now();
    const isLoggedIn = !!req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isAuthPage = AUTH_PAGES.includes(pathname);

    // Handle auth redirects
    let response: NextResponse | null = null;
    if (isAuthPage) {
      if (isLoggedIn) {
        response = NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } else if (!isLoggedIn) {
      response = NextResponse.redirect(new URL("/login", req.url));
    }

    // Check if this path should be logged
    const shouldLog =
      LOGGED_PATHS.some((path) => pathname.startsWith(path)) &&
      !SKIP_PATHS.some((path) => pathname.startsWith(path));

    // Log access if needed (non-blocking)
    if (shouldLog) {
      const duration = Date.now() - startTime;
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0] ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";
      const userId = req.nextauth.token?.sub;

      // Log asynchronously without awaiting
      logRequest({
        userId,
        ip,
        userAgent,
        path: pathname,
        method: req.method,
        statusCode: response?.status || 200,
        duration,
      }).catch((error) => {
        console.error("Failed to log request:", error);
      });
    }

    return response;
  },
  {
    callbacks: {
      authorized: () => true,
    },
  },
);

// Async function to log request (imported dynamically to avoid circular deps)
async function logRequest(data: {
  userId?: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  statusCode: number;
  duration: number;
}) {
  try {
    // Dynamic import to avoid issues with Prisma in middleware
    const { logger } = await import("@/lib/logger");
    await logger.logAccess(data);
  } catch (error) {
    // Silently fail - don't break the request
    console.error("Access logging failed:", error);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/api/:path*",
  ],
};
