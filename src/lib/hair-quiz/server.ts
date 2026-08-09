import { ObjectId, type Collection, type SortDirection } from "mongodb";

import {
  normalizeAdminTracking,
  type HairQuizFormData,
  type HairQuizSubmission,
  type SubmissionMeta,
} from "@/lib/hair-quiz/schema";

export const LIST_SORT_FIELDS = {
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  name: "formData.name",
} as const;

export type ListSortBy = keyof typeof LIST_SORT_FIELDS;

const HAIR_QUIZ_INDEXES = [
  { key: { createdAt: -1, _id: -1 } },
  { key: { "adminTracking.treatmentStatus": 1, createdAt: -1, _id: -1 } },
  { key: { "adminTracking.followUpAt": 1 } },
  {
    key: {
      "adminTracking.treatmentStatus": 1,
      "adminTracking.followUpEmailSentAt": 1,
      "adminTracking.treatmentCompletedAt": 1,
    },
  },
  { key: { "formData.whatsappCountry": 1 } },
  { key: { "submissionMeta.geo.country": 1 } },
  { key: { "submissionMeta.geo.city": 1 } },
] as const;

let indexesEnsured = false;

function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function resolveListSortField(sortBy: ListSortBy) {
  return LIST_SORT_FIELDS[sortBy];
}

export function getDocumentSortValue(doc: Record<string, unknown>, sortField: string) {
  if (!sortField.includes(".")) {
    return doc[sortField];
  }

  return sortField.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, doc);
}

export function buildAfterCursorFilter(
  cursorId: ObjectId,
  cursorSortValue: unknown,
  sortField: string,
  sortOrder: "asc" | "desc",
) {
  const op = sortOrder === "desc" ? "$lt" : "$gt";

  return {
    $or: [
      { [sortField]: { [op]: cursorSortValue } },
      { [sortField]: cursorSortValue, _id: { [op]: cursorId } },
    ],
  };
}

export function mergeQuery(
  baseQuery: Record<string, unknown>,
  extra: Record<string, unknown>,
) {
  if (Object.keys(baseQuery).length === 0) return extra;
  if (Object.keys(extra).length === 0) return baseQuery;
  return { $and: [baseQuery, extra] };
}

export function buildListSort(
  sortBy: ListSortBy,
  sortOrder: "asc" | "desc",
): Record<string, SortDirection> {
  const sortDirection: SortDirection = sortOrder === "asc" ? 1 : -1;
  const sortField = resolveListSortField(sortBy);
  return { [sortField]: sortDirection, _id: sortDirection };
}

export function serializeHairQuizDocument(doc: Record<string, unknown>): HairQuizSubmission {
  return {
    _id: doc._id instanceof ObjectId ? doc._id.toString() : String(doc._id),
    formData: doc.formData as HairQuizFormData,
    submissionMeta: doc.submissionMeta as SubmissionMeta | undefined,
    adminTracking: normalizeAdminTracking(doc.adminTracking),
    createdAt: toIso(doc.createdAt) ?? "",
    updatedAt: toIso(doc.updatedAt) ?? "",
  };
}

export async function ensureHairQuizIndexes(collection: Collection) {
  if (indexesEnsured) return;
  indexesEnsured = true;

  try {
    await collection.createIndexes([...HAIR_QUIZ_INDEXES]);
  } catch (error) {
    indexesEnsured = false;
    console.error("Failed to ensure hair quiz indexes:", error);
  }
}
