import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { ObjectId, type Collection } from "mongodb";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import clientPromise, { COLLECTIONS, DB_NAME } from "@/lib/db";
import { isHairQuizAdmin } from "@/lib/hair-quiz/api-auth";
import {
  buildHairQuizListQuery,
  getHairQuizFilterOptions,
  parseFiltersFromSearchParams,
} from "@/lib/hair-quiz/queries";
import {
  buildHairQuizCsv,
  DEFAULT_ADMIN_TRACKING,
  HAIR_QUIZ_CSV_EXPORT_LIMIT,
  normalizeAdminTracking,
  TREATMENT_STATUSES,
} from "@/lib/hair-quiz/schema";
import {
  buildAfterCursorFilter,
  buildListSort,
  ensureHairQuizIndexes,
  getDocumentSortValue,
  mergeQuery,
  resolveListSortField,
  serializeHairQuizDocument,
  type ListSortBy,
} from "@/lib/hair-quiz/server";
import {
  buildSubmissionMeta,
  parseClientContext,
} from "@/lib/request-metadata";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const hairQuizFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email"),
  whatsapp: z
    .string()
    .trim()
    .min(1, "WhatsApp number is required")
    .refine(
      (value) => isValidPhoneNumber(value),
      "Enter a valid WhatsApp number",
    ),
  instagramUsername: z.string().trim().min(1, "Instagram username is required"),
  hairThickness: z.enum(["thin", "medium", "thick"]),
  hairTexture: z.enum(["wavy", "straight", "curly"]),
  rootType: z.enum(["oily_24_48_hours", "dry", "oily_3_4_days"]),
  endsType: z
    .array(z.enum(["dry", "damaged", "thin", "split", "all_of_the_above"]))
    .min(1, "Select at least one option"),
  hasDandruffOrItchyScalp: z.enum(["yes", "no"]),
  washFrequencyPerWeek: z.coerce
    .number()
    .int("Enter a whole number")
    .min(0, "Must be 0 or more")
    .max(14, "Must be 14 or fewer"),
  getsFrizzy: z.enum(["yes", "no"]),
  hotToolsFrequency: z.enum([
    "weekly",
    "every_other_day",
    "twice_a_month",
    "very_rarely",
  ]),
  hairlossConcern: z
    .array(
      z.enum([
        "overall_thinning",
        "postpartum_or_post_covid",
        "bald_spots",
        "receding_hairline",
        "none",
      ]),
    )
    .min(1, "Select at least one option"),
  currentProducts: z.string().trim().optional(),
  isColorTreated: z.enum(["yes", "no"]),
  ultimateHairGoal: z.string().trim().min(1, "Please share your hair goal"),
  budget: z.enum(["150_170", "175_200", "250_plus"]),
  contactPreference: z.enum(["instagram", "whatsapp"]),
});

const listQuerySchema = z.object({
  id: z.string().trim().optional(),
  search: z.string().trim().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  cursor: z.string().trim().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  includeTotal: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

const adminPatchSchema = z
  .object({
    id: z.string().trim().min(1),
    treatmentStatus: z.enum(TREATMENT_STATUSES).optional(),
    markOutreach: z.enum(["whatsapp", "instagram"]).optional(),
    addNote: z.string().trim().min(1).max(2000).optional(),
    followUpAt: z.string().trim().optional(),
    clearFollowUp: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.treatmentStatus ||
      data.markOutreach ||
      data.addNote ||
      data.followUpAt !== undefined ||
      data.clearFollowUp,
    { message: "Provide at least one field to update" },
  );

function normalizeInstagramUsername(value: string) {
  return value.trim().replace(/^@+/, "");
}

function parseHairQuizPayload(body: unknown) {
  if (!body || typeof body !== "object") {
    return hairQuizFormSchema.safeParse(body);
  }

  const data = body as Record<string, unknown>;
  return hairQuizFormSchema.safeParse({
    ...data,
    instagramUsername:
      typeof data.instagramUsername === "string"
        ? normalizeInstagramUsername(data.instagramUsername)
        : data.instagramUsername,
  });
}

function resolveWhatsappCountry(whatsapp: string) {
  try {
    return parsePhoneNumber(whatsapp)?.country;
  } catch {
    return undefined;
  }
}

async function requireAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !(await isHairQuizAdmin(session.user?.email))) {
    return null;
  }

  return session;
}

async function getCollection() {
  const client = await clientPromise;
  const collection = client.db(DB_NAME).collection(COLLECTIONS.HAIR_QUIZ_FORMS);
  await ensureHairQuizIndexes(collection);
  return collection;
}

async function exportHairQuizCsv(
  collection: Collection,
  query: Record<string, unknown>,
) {
  const submissions = [];
  let lastId: ObjectId | null = null;

  while (submissions.length < HAIR_QUIZ_CSV_EXPORT_LIMIT) {
    const batchQuery =
      lastId && Object.keys(query).length
        ? { $and: [query, { _id: { $lt: lastId } }] }
        : lastId
          ? { _id: { $lt: lastId } }
          : query;

    const batch = await collection
      .find(batchQuery)
      .sort({ _id: -1 })
      .limit(Math.min(500, HAIR_QUIZ_CSV_EXPORT_LIMIT - submissions.length))
      .toArray();

    if (batch.length === 0) break;

    for (const doc of batch) {
      submissions.push(serializeHairQuizDocument(doc));
    }

    lastId = batch[batch.length - 1]?._id as ObjectId;
  }

  const filename = `hair-quiz-submissions-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(buildHairQuizCsv(submissions), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/** Public form submission. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientContext: rawClientContext, ...formBody } =
      (body ?? {}) as Record<string, unknown>;
    const parsed = parseHairQuizPayload(formBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const now = new Date();
    const collection = await getCollection();
    const submissionMeta = buildSubmissionMeta(
      req,
      parseClientContext(rawClientContext),
    );
    const whatsappCountry = resolveWhatsappCountry(parsed.data.whatsapp);

    const result = await collection.insertOne({
      formData: {
        ...parsed.data,
        ...(whatsappCountry ? { whatsappCountry } : {}),
      },
      submissionMeta,
      adminTracking: DEFAULT_ADMIN_TRACKING,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      { message: "Hair quiz submitted successfully", id: result.insertedId.toString() },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error submitting hair quiz:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Admin list, read, filter options, CSV export. */
export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const collection = await getCollection();

    if (url.searchParams.get("filterOptions") === "true") {
      return NextResponse.json({
        filterOptions: await getHairQuizFilterOptions(collection),
      });
    }

    const filters = parseFiltersFromSearchParams(url.searchParams);
    const search = url.searchParams.get("search")?.trim() || undefined;

    if (url.searchParams.get("export") === "csv") {
      return exportHairQuizCsv(collection, buildHairQuizListQuery(search, filters));
    }

    const parsedQuery = listQuerySchema.safeParse({
      id: url.searchParams.get("id") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
      sortBy: url.searchParams.get("sortBy") ?? undefined,
      sortOrder: url.searchParams.get("sortOrder") ?? undefined,
      includeTotal: url.searchParams.get("includeTotal") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsedQuery.error.flatten() },
        { status: 400 },
      );
    }

    const { id, limit, cursor, sortBy, sortOrder, includeTotal } = parsedQuery.data;

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      const document = await collection.findOne({ _id: new ObjectId(id) });
      if (!document) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ data: serializeHairQuizDocument(document) });
    }

    const baseQuery = buildHairQuizListQuery(search, filters);
    const sort = buildListSort(sortBy as ListSortBy, sortOrder);
    const sortField = resolveListSortField(sortBy as ListSortBy);

    let query = baseQuery;

    if (cursor) {
      if (!ObjectId.isValid(cursor)) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }

      const cursorDoc = await collection.findOne(
        { _id: new ObjectId(cursor) },
        { projection: { [sortField]: 1 } },
      );

      if (!cursorDoc) {
        return NextResponse.json({ error: "Cursor not found" }, { status: 404 });
      }

      query = mergeQuery(
        baseQuery,
        buildAfterCursorFilter(
          new ObjectId(cursor),
          getDocumentSortValue(cursorDoc, sortField),
          sortField,
          sortOrder,
        ),
      );
    }

    const [items, total] = await Promise.all([
      collection
        .find(query)
        .sort(sort)
        .limit(limit + 1)
        .toArray(),
      includeTotal ? collection.countDocuments(baseQuery) : Promise.resolve(undefined),
    ]);

    const hasNextPage = items.length > limit;
    const pageItems = hasNextPage ? items.slice(0, limit) : items;
    const nextCursor = hasNextPage
      ? pageItems[pageItems.length - 1]?._id?.toString() ?? null
      : null;
    const pageCount =
      typeof total === "number" && total > 0 ? Math.ceil(total / limit) : undefined;

    return NextResponse.json({
      data: pageItems.map((item) => serializeHairQuizDocument(item)),
      pagination: {
        limit,
        sortBy,
        sortOrder,
        nextCursor,
        hasNextPage,
        hasPreviousPage: Boolean(cursor),
        ...(typeof total === "number" ? { total, pageCount } : {}),
        count: pageItems.length,
      },
    });
  } catch (error) {
    console.error("Error fetching hair quiz forms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Admin workflow updates: status, outreach, notes, follow-up. */
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = adminPatchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { id, treatmentStatus, markOutreach, addNote, followUpAt, clearFollowUp } =
      parsed.data;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const collection = await getCollection();
    const now = new Date();
    const existing = await collection.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const adminTracking = normalizeAdminTracking(existing.adminTracking);

    if (treatmentStatus) {
      adminTracking.treatmentStatus = treatmentStatus;
    }

    if (markOutreach === "whatsapp") {
      adminTracking.whatsappAt = now.toISOString();
    }

    if (markOutreach === "instagram") {
      adminTracking.instagramAt = now.toISOString();
    }

    if (clearFollowUp) {
      adminTracking.followUpAt = null;
    } else if (followUpAt !== undefined) {
      const parsedFollowUp = new Date(followUpAt);
      if (Number.isNaN(parsedFollowUp.getTime())) {
        return NextResponse.json({ error: "Invalid followUpAt" }, { status: 400 });
      }
      adminTracking.followUpAt = parsedFollowUp.toISOString();
    }

    if (addNote) {
      adminTracking.notes = [
        {
          text: addNote,
          createdAt: now.toISOString(),
          createdBy: session.user.email ?? session.user.name ?? undefined,
        },
        ...adminTracking.notes,
      ].slice(0, 100);
    }

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { adminTracking, updatedAt: now } },
    );

    const updated = await collection.findOne({ _id: new ObjectId(id) });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Submission updated",
      data: serializeHairQuizDocument(updated),
    });
  } catch (error) {
    console.error("Error patching hair quiz admin tracking:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Admin delete. */
export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = (await req.json()) as { id?: string };

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const collection = await getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Hair quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting hair quiz:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
