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
    title: "Patients",
    url: "#",
    icon: UserRound,
    isActive: false,
    items: [
      {
        title: "Manage Queue",
        url: "/protected/queue",
        requiresAccess: true,
      },
      {
        title: "Manage Patients",
        url: "/protected/patients",
        requiresAccess: true,
      },
      {
        title: "Prescriptions",
        url: "/protected/doctors/prescriptions",
        requiresAccess: true,
      },
      {
        title: "AI Agent",
        url: "/protected/ai-agent",
        requiresAccess: true,
      },
    ],
  },
  {
    title: "Appointments",
    url: "#",
    icon: CalendarCheck,
    isActive: false,
    items: [
      {
        title: "Manage Appointments",
        url: "/protected/appointments",
        requiresAccess: true,
      },
    ],
  },
  {
    title: "Pharmacy",
    url: "#",
    icon: Pill,
    isActive: false,
    items: [
      {
        title: "Point of Sale",
        url: "/protected/pharmacy/pos",
        requiresAccess: true,
      },
      {
        title: "Manage Inventory",
        url: "/protected/pharmacy/inventory",
        requiresAccess: true,
      },
      {
        title: "Pharmacy Bills",
        url: "/protected/pharmacy/pos/bills",
        requiresAccess: true,
      },
    ],
  },
  {
    title: "Doctors",
    url: "#",
    icon: Stethoscope,
    isActive: false,
    items: [
      {
        title: "Manage Doctors",
        url: "/protected/doctors",
        requiresAccess: true,
      },
    ],
  },
  {
    title: "Website",
    url: "#",
    icon: Globe,
    isActive: false,
    items: [
      {
        title: "Manage Website",
        url: "/protected/website",
        requiresAccess: true,
      },
    ],
  },
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
