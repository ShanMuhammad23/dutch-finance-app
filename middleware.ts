import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

const PUBLIC_ROUTES = [
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/forgot-password",
];

const ADMIN_PREFIX = "/admin";

export default withAuth(
  (req) => {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    if (pathname.startsWith(ADMIN_PREFIX) && token?.role !== "admin") {
      const signInUrl = new URL("/auth/sign-in", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;

        if (
          PUBLIC_ROUTES.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`),
          )
        ) {
          return true;
        }

        return Boolean(token);
      },
    },
  },
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|public).*)",
  ],
};

