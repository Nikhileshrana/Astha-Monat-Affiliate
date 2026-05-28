import { hasRouteAccess } from "@/lib/access-control";
import { ADMIN_EMAIL } from "@/lib/routes";

export const AFFILIATE_ADMIN_ROUTE = "/protected/affiliateApplications";

export async function isAffiliateAdmin(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;
  return hasRouteAccess(email.toLowerCase(), AFFILIATE_ADMIN_ROUTE);
}
