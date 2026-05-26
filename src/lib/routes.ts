import {
  LucideIcon,
  ShieldCheck,
  Globe,
  Receipt,
  CalendarCheck,
  UserRound,
  Pill,
  Stethoscope,
} from "lucide-react";

export const ADMIN_EMAIL = "realnikhileshrana@gmail.com";

// Type definition for our route configuration
export interface RouteItem {
  title: string;
  url: string;
  requiresAccess: boolean;
}

export interface RouteGroup {
  title: string;
  url: string;
  icon: LucideIcon | string | any;
  isActive: boolean;
  items: RouteItem[];
}

export const ROUTES_CONFIG: RouteGroup[] = [
  {
    title: "Access Control",
    url: "#",
    icon: ShieldCheck,
    isActive: false,
    items: [
      {
        title: "Manage Permissions",
        url: "/protected/manageAccess",
        requiresAccess: true,
      },
    ],
  },
];

// Helper to extract free routes (requiresAccess: false)
export function getFreeRoutes(): readonly string[] {
  return ROUTES_CONFIG.flatMap((group) =>
    group.items
      .filter((item) => item.requiresAccess === false)
      .map((item) => item.url),
  );
}

// Return all configured URLs
export function getAvailableRoutes(): readonly string[] {
  return ROUTES_CONFIG.flatMap((group) => group.items.map((item) => item.url));
}
