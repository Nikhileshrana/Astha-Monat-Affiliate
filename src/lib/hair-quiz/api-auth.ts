import { hasRouteAccess } from "@/lib/access-control";
import { ADMIN_EMAIL } from "@/lib/routes";

export const HAIR_QUIZ_ADMIN_ROUTE = "/protected/hairQuizForms";

export async function isHairQuizAdmin(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;
  return hasRouteAccess(email.toLowerCase(), HAIR_QUIZ_ADMIN_ROUTE);
}
