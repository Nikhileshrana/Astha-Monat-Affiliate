import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { hasRouteAccess } from "@/lib/access-control";
import { getAvailableRoutes, ADMIN_EMAIL } from "@/lib/routes";

// Helper to create a route matcher
const createRouteMatcher = (patterns: string[]) => {
  const regexes = patterns.map((pattern) => {
    // Replace (.*) with .* and express parameters like :id with [.+]
    const regexPattern = pattern.replace(/\(\.\*\)/g, ".*").replace(/:[a-zA-Z0-9_]+/g, "[^/]+");
    return new RegExp(`^${regexPattern}$`);
  });

  return (req: NextRequest) => {
    return regexes.some((regex) => regex.test(req.nextUrl.pathname));
  };
};

const isPublicRoute = createRouteMatcher([
  "/auth(.*)",
  "/api/auth(.*)",
  "/api/blob",
  "/api/website",
  "/",
  "/api/hair-quiz(.*)",
  "/hair-quiz(.*)",
]);

// Protected routes fetched securely
const protectedRoutes = getAvailableRoutes();
const isProtectedRoute = createRouteMatcher(protectedRoutes.map(route => route + "(.*)"));

// Proxy Better Auth session getter for edge runtime
async function getUserEmail(req: NextRequest): Promise<string | null> {
  try {
    const origin = req.nextUrl.origin;
    const res = await fetch(`${origin}/api/auth/get-session`, {
      headers: { cookie: req.headers.get("cookie") || "" }
    });

    if (res.ok) {
      const data = await res.json();
      return data?.user?.email || null;
    }
  } catch (error) {
    console.error("Middleware fetch BetterAuth config missing:", error);
  }
  return null;
}

export async function proxy(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);

  // If unauthenticated trying to access non-public route
  if (!isPublicRoute(req)) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/auth?mode=signin", req.url));
    }
  }

  // If user tries signing in but has session, go dashboard
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/protected", req.url));
  }

  // Authorize routing based on configuration list strictly
  if (isProtectedRoute(req)) {
    try {
      const userEmail = await getUserEmail(req);
      if (!userEmail) return NextResponse.redirect(new URL("/auth?mode=signin", req.url));

      const normalizedEmail = userEmail.toLowerCase().trim();
      if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) return NextResponse.next();

      const pathname = req.nextUrl.pathname;
      const hasAccess = await hasRouteAccess(normalizedEmail, pathname);

      if (!hasAccess) {
        return NextResponse.redirect(new URL("/user", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/user", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Next.js static asset optimizations / api bypasses
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};