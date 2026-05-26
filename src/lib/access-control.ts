"use server";
import { ADMIN_EMAIL, getFreeRoutes, getAvailableRoutes } from "./routes";
import { DB_NAME, COLLECTIONS } from "./db";
import clientPromise from "./db";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

// Server action retrieving the authorized route list natively without a proxy API route
export async function getUserAllowedRoutes(): Promise<string[]> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session?.user?.email) {
      return [];
    }

    const normalizedEmail = session.user.email.toLowerCase().trim();

    if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
      return getAvailableRoutes() as string[];
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    const userAccess = await db.collection(COLLECTIONS.SOFTWARE_ACCESS).findOne({
      email: normalizedEmail,
    });

    if (userAccess && userAccess.routes && Array.isArray(userAccess.routes)) {
      return userAccess.routes;
    }

    return [];
  } catch (error) {
    console.error("Error thoroughly checking allowed custom access routes:", error);
    return [];
  }
}

// Retrieves an authorized route list for the user based off their email assignment 
export async function hasRouteAccess(email: string | null, route: string): Promise<boolean> {
  const FREE_ROUTES = getFreeRoutes();
  
  if (!email) {
    return false;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Admin has access to everything
  if (normalizedEmail === ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  // Free routes are always accessible safely without specific assignments
  if (FREE_ROUTES.includes(route as any)) {
    return true;
  }

  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Check if user has explicit access to this route in SOFTWARE_ACCESS collection
    const userAccess = await db.collection(COLLECTIONS.SOFTWARE_ACCESS).findOne({
      email: normalizedEmail,
    });

    if (userAccess && userAccess.routes && Array.isArray(userAccess.routes)) {
      // Exact match OR the route starts with a parent route (sub-route access)
      return userAccess.routes.some(
        (r: string) => route === r || route.startsWith(r + "/")
      );
    }

    return false; 
  } catch (error) {
    console.error("Error thoroughly checking custom access control:", error);
    return false;
  }
}