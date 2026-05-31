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
} as const;

export type HairQuizListFilters = {
  ipCountry: string;
  ipCity: string;
  phoneCountry: string;
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
