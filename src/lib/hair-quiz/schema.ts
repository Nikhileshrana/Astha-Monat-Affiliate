export const TREATMENT_STATUSES = [
  "pending",
  "in_progress",
  "completed",
  "failed",
] as const;

export type TreatmentStatus = (typeof TREATMENT_STATUSES)[number];

export type AdminNote = {
  text: string;
  createdAt: string;
  createdBy?: string;
};

/** Admin workflow state stored on each submission. */
export type AdminTracking = {
  treatmentStatus: TreatmentStatus;
  followUpAt: string | null;
  whatsappAt?: string;
  instagramAt?: string;
  notes: AdminNote[];
};

export const DEFAULT_ADMIN_TRACKING: AdminTracking = {
  treatmentStatus: "pending",
  followUpAt: null,
  notes: [],
};

export const TREATMENT_STATUS_OPTIONS: {
  value: TreatmentStatus;
  label: string;
  dotClass: string;
  activeRingClass: string;
}[] = [
  {
    value: "pending",
    label: "Result pending",
    dotClass: "bg-orange-500",
    activeRingClass: "ring-orange-500/40",
  },
  {
    value: "in_progress",
    label: "Treatment in progress",
    dotClass: "bg-yellow-400",
    activeRingClass: "ring-yellow-400/40",
  },
  {
    value: "completed",
    label: "Treatment given",
    dotClass: "bg-green-500",
    activeRingClass: "ring-green-500/40",
  },
  {
    value: "failed",
    label: "Treatment failed",
    dotClass: "bg-red-500",
    activeRingClass: "ring-red-500/40",
  },
];

export const FILTER_ENUMS = {
  hairThickness: ["thin", "medium", "thick"],
  hairTexture: ["wavy", "straight", "curly"],
  rootType: ["oily_24_48_hours", "dry", "oily_3_4_days"],
  endsType: ["dry", "damaged", "thin", "split", "all_of_the_above"],
  hasDandruffOrItchyScalp: ["yes", "no"],
  getsFrizzy: ["yes", "no"],
  hotToolsFrequency: ["weekly", "every_other_day", "twice_a_month", "very_rarely"],
  hairlossConcern: [
    "overall_thinning",
    "postpartum_or_post_covid",
    "bald_spots",
    "receding_hairline",
    "none",
  ],
  isColorTreated: ["yes", "no"],
  budget: ["150_170", "175_200", "250_plus"],
  contactPreference: ["instagram", "whatsapp"],
  treatmentStatus: [...TREATMENT_STATUSES],
} as const;

export type HairQuizListFilters = {
  ipCountry: string;
  ipCity: string;
  phoneCountry: string;
  treatmentStatus: string[];
  contactPreference: string[];
  budget: string[];
  hairThickness: string[];
  hairTexture: string[];
  rootType: string[];
  endsType: string[];
  hasDandruffOrItchyScalp: string[];
  getsFrizzy: string[];
  hotToolsFrequency: string[];
  hairlossConcern: string[];
  isColorTreated: string[];
};

export const EMPTY_HAIR_QUIZ_FILTERS: HairQuizListFilters = {
  ipCountry: "",
  ipCity: "",
  phoneCountry: "",
  treatmentStatus: [],
  contactPreference: [],
  budget: [],
  hairThickness: [],
  hairTexture: [],
  rootType: [],
  endsType: [],
  hasDandruffOrItchyScalp: [],
  getsFrizzy: [],
  hotToolsFrequency: [],
  hairlossConcern: [],
  isColorTreated: [],
};

export type HairQuizFilterOptions = {
  ipCountries: string[];
  ipCities: string[];
  phoneCountries: string[];
};

export type SubmissionMeta = {
  capturedAt?: string;
  ip?: string | null;
  geo?: {
    country?: string;
    region?: string;
    city?: string;
    latitude?: string;
    longitude?: string;
    timezone?: string;
  };
  device?: {
    browser?: { name?: string; version?: string };
    os?: { name?: string; version?: string };
    device?: { type?: string; vendor?: string; model?: string };
  };
  userAgent?: string | null;
  clientContext?: {
    language?: string;
    platform?: string;
    timezone?: string;
  };
};

export type HairQuizFormData = {
  name: string;
  email: string;
  whatsapp: string;
  whatsappCountry?: string;
  instagramUsername: string;
  hairThickness: string;
  hairTexture: string;
  rootType: string;
  endsType: string | string[];
  hasDandruffOrItchyScalp: string;
  washFrequencyPerWeek: number;
  getsFrizzy: string;
  hotToolsFrequency: string;
  hairlossConcern: string | string[];
  currentProducts?: string;
  isColorTreated: string;
  ultimateHairGoal: string;
  budget: string;
  contactPreference: string;
};

export type HairQuizSubmission = {
  _id: string;
  formData: HairQuizFormData;
  submissionMeta?: SubmissionMeta;
  adminTracking: AdminTracking;
  createdAt: string;
  updatedAt: string;
};

export type HairQuizListPagination = {
  limit: number;
  nextCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  total?: number;
  pageCount?: number;
};

export const FIELD_LABELS: Record<string, string> = {
  thin: "Thin",
  medium: "Medium",
  thick: "Thick",
  wavy: "Wavy",
  straight: "Straight",
  curly: "Curly",
  oily_24_48_hours: "Oily (24–48h)",
  dry: "Dry",
  oily_3_4_days: "Oily in 3–4 days",
  damaged: "Damaged",
  split: "Split",
  all_of_the_above: "All of the above",
  yes: "Yes",
  no: "No",
  weekly: "Weekly",
  every_other_day: "Every other day",
  twice_a_month: "Twice a month",
  very_rarely: "Very rarely",
  overall_thinning: "Overall thinning",
  postpartum_or_post_covid: "Postpartum / Post Covid",
  bald_spots: "Bald spots",
  receding_hairline: "Receding hairline",
  none: "No hairloss",
  "150_170": "$150–$170",
  "175_200": "$175–$200",
  "250_plus": "$250+",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  pending: "Result pending",
  in_progress: "In progress",
  completed: "Treatment given",
  failed: "Treatment failed",
};

export const HAIR_QUIZ_CSV_EXPORT_LIMIT = 10_000;

function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function readNote(value: unknown): AdminNote | null {
  if (!value || typeof value !== "object") return null;
  const note = value as Record<string, unknown>;
  const text = typeof note.text === "string" ? note.text.trim() : "";
  const createdAt = toIso(note.createdAt);
  if (!text || !createdAt) return null;
  return {
    text,
    createdAt,
    createdBy: typeof note.createdBy === "string" ? note.createdBy : undefined,
  };
}

export function normalizeAdminTracking(value: unknown): AdminTracking {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ADMIN_TRACKING, notes: [] };
  }

  const admin = value as Record<string, unknown>;
  const treatmentStatus = TREATMENT_STATUSES.includes(
    admin.treatmentStatus as TreatmentStatus,
  )
    ? (admin.treatmentStatus as TreatmentStatus)
    : "pending";

  const notes = Array.isArray(admin.notes)
    ? admin.notes
        .map(readNote)
        .filter((note): note is AdminNote => note !== null)
        .slice(0, 100)
    : [];

  const whatsappAt = toIso(admin.whatsappAt);
  const instagramAt = toIso(admin.instagramAt);

  return {
    treatmentStatus,
    followUpAt: toIso(admin.followUpAt) ?? null,
    ...(whatsappAt ? { whatsappAt } : {}),
    ...(instagramAt ? { instagramAt } : {}),
    notes,
  };
}

export function getTreatmentStatusMeta(status: TreatmentStatus) {
  return (
    TREATMENT_STATUS_OPTIONS.find((option) => option.value === status) ??
    TREATMENT_STATUS_OPTIONS[0]
  );
}

export function isFollowUpOverdue(followUpAt: string | null | undefined) {
  if (!followUpAt) return false;
  return new Date(followUpAt).getTime() < Date.now();
}

export function formatFieldValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    return value.map((item) => FIELD_LABELS[String(item)] ?? String(item)).join(", ");
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return FIELD_LABELS[value] ?? value;
  return String(value);
}

function csvCell(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : Array.isArray(value)
        ? value.join("; ")
        : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildHairQuizCsv(submissions: HairQuizSubmission[]) {
  const headers = [
    "id",
    "name",
    "email",
    "whatsapp",
    "instagram",
    "contactPreference",
    "budget",
    "treatmentStatus",
    "followUpAt",
    "whatsappAt",
    "instagramAt",
    "latestNote",
    "ipCountry",
    "ipCity",
    "phoneCountry",
    "submittedAt",
  ];

  const lines = [headers.join(",")];

  for (const submission of submissions) {
    const form = submission.formData;
    const geo = submission.submissionMeta?.geo;
    const admin = submission.adminTracking;

    lines.push(
      [
        submission._id,
        form.name,
        form.email,
        form.whatsapp,
        form.instagramUsername,
        form.contactPreference,
        form.budget,
        getTreatmentStatusMeta(admin.treatmentStatus).label,
        admin.followUpAt ?? "",
        admin.whatsappAt ?? "",
        admin.instagramAt ?? "",
        admin.notes[0]?.text ?? "",
        geo?.country ?? "",
        geo?.city ?? "",
        form.whatsappCountry ?? "",
        submission.createdAt,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  return lines.join("\n");
}
