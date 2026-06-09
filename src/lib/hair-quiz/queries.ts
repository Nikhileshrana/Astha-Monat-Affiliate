import type { Collection } from "mongodb";

import {
  EMPTY_HAIR_QUIZ_FILTERS,
  FILTER_ENUMS,
  type HairQuizFilterOptions,
  type HairQuizListFilters,
} from "@/lib/hair-quiz/schema";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildSearchQuery(search?: string) {
  if (!search) return {};

  const pattern = escapeRegex(search);
  return {
    $or: [
      { "formData.name": { $regex: pattern, $options: "i" } },
      { "formData.email": { $regex: pattern, $options: "i" } },
      { "formData.instagramUsername": { $regex: pattern, $options: "i" } },
      { "formData.whatsapp": { $regex: pattern, $options: "i" } },
    ],
  };
}

function buildLocationFilters(filters: HairQuizListFilters) {
  const clauses: Record<string, unknown>[] = [];

  if (filters.ipCountry) {
    clauses.push({
      "submissionMeta.geo.country": {
        $regex: `^${escapeRegex(filters.ipCountry)}$`,
        $options: "i",
      },
    });
  }

  if (filters.ipCity) {
    clauses.push({
      "submissionMeta.geo.city": {
        $regex: `^${escapeRegex(filters.ipCity)}$`,
        $options: "i",
      },
    });
  }

  if (filters.phoneCountry) {
    clauses.push({
      "formData.whatsappCountry": filters.phoneCountry.toUpperCase(),
    });
  }

  return clauses;
}

function buildFormFilters(filters: HairQuizListFilters) {
  const clauses: Record<string, unknown>[] = [];

  if (filters.treatmentStatus.length > 0) {
    clauses.push({
      "adminTracking.treatmentStatus": { $in: filters.treatmentStatus },
    });
  }

  const scalarKeys = [
    "hairThickness",
    "hairTexture",
    "rootType",
    "hasDandruffOrItchyScalp",
    "getsFrizzy",
    "hotToolsFrequency",
    "isColorTreated",
    "contactPreference",
    "budget",
  ] as const;

  for (const key of scalarKeys) {
    if (filters[key].length > 0) {
      clauses.push({ [`formData.${key}`]: { $in: filters[key] } });
    }
  }

  for (const key of ["endsType", "hairlossConcern"] as const) {
    if (filters[key].length > 0) {
      clauses.push({ [`formData.${key}`]: { $in: filters[key] } });
    }
  }

  return clauses;
}

export function buildHairQuizListQuery(
  search?: string,
  filters: HairQuizListFilters = EMPTY_HAIR_QUIZ_FILTERS,
) {
  const parts: Record<string, unknown>[] = [];
  const searchQuery = buildSearchQuery(search);

  if (Object.keys(searchQuery).length > 0) parts.push(searchQuery);
  parts.push(...buildLocationFilters(filters), ...buildFormFilters(filters));

  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

export async function getHairQuizFilterOptions(
  collection: Collection,
): Promise<HairQuizFilterOptions> {
  const [ipCountries, ipCities, phoneCountries] = await Promise.all([
    collection.distinct("submissionMeta.geo.country", {
      "submissionMeta.geo.country": { $exists: true, $nin: [null, ""] },
    }),
    collection.distinct("submissionMeta.geo.city", {
      "submissionMeta.geo.city": { $exists: true, $nin: [null, ""] },
    }),
    collection.distinct("formData.whatsappCountry", {
      "formData.whatsappCountry": { $exists: true, $nin: [null, ""] },
    }),
  ]);

  return {
    ipCountries: ipCountries.filter(Boolean).sort(),
    ipCities: ipCities.filter(Boolean).sort(),
    phoneCountries: phoneCountries.filter(Boolean).sort(),
  };
}

export function countActiveFilters(filters: HairQuizListFilters) {
  let count = 0;
  if (filters.ipCountry) count += 1;
  if (filters.ipCity) count += 1;
  if (filters.phoneCountry) count += 1;

  for (const key of Object.keys(FILTER_ENUMS) as (keyof typeof FILTER_ENUMS)[]) {
    count += filters[key].length;
  }

  return count;
}

export function appendFiltersToSearchParams(
  params: URLSearchParams,
  filters: HairQuizListFilters,
) {
  if (filters.ipCountry) params.set("ipCountry", filters.ipCountry);
  if (filters.ipCity) params.set("ipCity", filters.ipCity);
  if (filters.phoneCountry) params.set("phoneCountry", filters.phoneCountry);

  for (const key of Object.keys(FILTER_ENUMS) as (keyof typeof FILTER_ENUMS)[]) {
    if (filters[key].length > 0) {
      params.set(key, filters[key].join(","));
    }
  }
}

export function parseFiltersFromSearchParams(
  params: URLSearchParams,
): HairQuizListFilters {
  const next = { ...EMPTY_HAIR_QUIZ_FILTERS };
  next.ipCountry = params.get("ipCountry")?.trim() ?? "";
  next.ipCity = params.get("ipCity")?.trim() ?? "";
  next.phoneCountry = params.get("phoneCountry")?.trim() ?? "";

  for (const key of Object.keys(FILTER_ENUMS) as (keyof typeof FILTER_ENUMS)[]) {
    const raw = params.get(key);
    if (!raw) continue;
    const allowed = new Set<string>(FILTER_ENUMS[key]);
    next[key] = raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => allowed.has(value));
  }

  return next;
}
