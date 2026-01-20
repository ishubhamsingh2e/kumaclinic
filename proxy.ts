import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/signup", "/forgot-password", "/reset-password"];

export default withAuth(
  function middleware(req) {
    const isLoggedIn = !!req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isAuthPage = AUTH_PAGES.includes(pathname);

    if (isAuthPage) {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return null;
    }

    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return null;
  },
  {
    callbacks: {
      authorized: () => true,
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
