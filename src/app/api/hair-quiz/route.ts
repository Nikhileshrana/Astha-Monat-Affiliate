import { isValidPhoneNumber } from "libphonenumber-js";
import { ObjectId, type SortDirection } from "mongodb";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import clientPromise, { COLLECTIONS, DB_NAME } from "@/lib/db";
import { isHairQuizAdmin } from "@/lib/hair-quiz/api-auth";
import {
  buildSubmissionMeta,
  parseClientContext,
} from "@/lib/request-metadata";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SKIP = 50_000;

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
  endsType: z.enum(["dry", "damaged", "thin", "split", "all_of_the_above"]),
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
  hairlossConcern: z.enum([
    "overall_thinning",
    "postpartum_or_post_covid",
    "bald_spots",
    "receding_hairline",
    "none",
  ]),
  currentProducts: z.string().trim().optional(),
  isColorTreated: z.enum(["yes", "no"]),
  ultimateHairGoal: z.string().trim().min(1, "Please share your hair goal"),
  budget: z.enum(["150_170", "175_200", "250_plus"]),
  contactPreference: z.enum(["instagram", "whatsapp"]),
});

const listQuerySchema = z.object({
  id: z.string().trim().optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  cursor: z.string().trim().optional(),
});

type HairQuizFormInput = z.infer<typeof hairQuizFormSchema>;

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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeDocument(doc: Record<string, unknown>) {
  return {
    ...doc,
    _id: doc._id instanceof ObjectId ? doc._id.toString() : doc._id,
    createdAt:
      doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
    updatedAt:
      doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : doc.updatedAt,
  };
}

function buildSearchQuery(search?: string) {
  if (!search) return {};

  const pattern = escapeRegex(search);
  return {
    $or: [
      { name: { $regex: pattern, $options: "i" } },
      { email: { $regex: pattern, $options: "i" } },
      { instagramUsername: { $regex: pattern, $options: "i" } },
      { whatsapp: { $regex: pattern, $options: "i" } },
    ],
  };
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
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const submissionMeta = buildSubmissionMeta(
      req,
      parseClientContext(rawClientContext),
    );

    const result = await db.collection(COLLECTIONS.HAIR_QUIZ_FORMS).insertOne({
      ...parsed.data,
      submissionMeta,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        message: "Hair quiz submitted successfully",
        id: result.insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error submitting hair quiz:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Protected paginated list/read for admin CRUD. */
export async function GET(req: NextRequest) {
  try {
    if (!(await requireAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsedQuery = listQuerySchema.safeParse({
      id: url.searchParams.get("id") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      sortBy: url.searchParams.get("sortBy") ?? undefined,
      sortOrder: url.searchParams.get("sortOrder") ?? undefined,
      cursor: url.searchParams.get("cursor") ?? undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsedQuery.error.flatten() },
        { status: 400 },
      );
    }

    const { id, search, page, limit, sortBy, sortOrder, cursor } = parsedQuery.data;
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTIONS.HAIR_QUIZ_FORMS);

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      const document = await collection.findOne({ _id: new ObjectId(id) });
      if (!document) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ data: serializeDocument(document) });
    }

    const query = buildSearchQuery(search);
    const sortDirection: SortDirection = sortOrder === "asc" ? 1 : -1;
    const sort = {
      [sortBy]: sortDirection,
      _id: sortDirection,
    } as Record<string, SortDirection>;

    if (cursor) {
      if (!ObjectId.isValid(cursor)) {
        return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
      }

      const cursorDoc = await collection.findOne(
        { _id: new ObjectId(cursor) },
        { projection: { [sortBy]: 1 } },
      );

      if (!cursorDoc) {
        return NextResponse.json({ error: "Cursor not found" }, { status: 404 });
      }

      const cursorValue = cursorDoc[sortBy];

      const cursorFilter =
        sortOrder === "desc"
          ? {
              $or: [
                { [sortBy]: { $lt: cursorValue } },
                {
                  [sortBy]: cursorValue,
                  _id: { $lt: new ObjectId(cursor) },
                },
              ],
            }
          : {
              $or: [
                { [sortBy]: { $gt: cursorValue } },
                {
                  [sortBy]: cursorValue,
                  _id: { $gt: new ObjectId(cursor) },
                },
              ],
            };

      const cursorQuery = Object.keys(query).length
        ? { $and: [query, cursorFilter] }
        : cursorFilter;

      const items = await collection
        .find(cursorQuery)
        .sort(sort)
        .limit(limit + 1)
        .toArray();

      const hasNextPage = items.length > limit;
      const pageItems = hasNextPage ? items.slice(0, limit) : items;
      const nextCursor = hasNextPage
        ? pageItems[pageItems.length - 1]?._id?.toString()
        : null;

      return NextResponse.json({
        data: pageItems.map((item) => serializeDocument(item)),
        pagination: {
          mode: "cursor",
          limit,
          sortBy,
          sortOrder,
          hasNextPage,
          hasPreviousPage: Boolean(cursor),
          nextCursor,
          count: pageItems.length,
        },
      });
    }

    const skip = (page - 1) * limit;
    if (skip > MAX_SKIP) {
      return NextResponse.json(
        {
          error: `Offset too large. Use cursor pagination with ?cursor=<id> beyond page ${Math.floor(MAX_SKIP / limit) + 1}.`,
        },
        { status: 400 },
      );
    }

    const [items, total] = await Promise.all([
      collection.find(query).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(query),
    ]);

    const pageCount = total === 0 ? 0 : Math.ceil(total / limit);
    const hasNextPage = page < pageCount;
    const hasPreviousPage = page > 1;
    const nextCursor = hasNextPage ? items[items.length - 1]?._id?.toString() : null;

    return NextResponse.json({
      data: items.map((item) => serializeDocument(item)),
      pagination: {
        mode: "offset",
        page,
        limit,
        total,
        pageCount,
        sortBy,
        sortOrder,
        hasNextPage,
        hasPreviousPage,
        nextCursor,
        count: items.length,
      },
    });
  } catch (error) {
    console.error("Error fetching hair quiz forms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Protected update for admin CRUD. */
export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...rest } = body as { id?: string } & Partial<HairQuizFormInput>;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const parsed = parseHairQuizPayload(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTIONS.HAIR_QUIZ_FORMS).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...parsed.data,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Hair quiz updated successfully" });
  } catch (error) {
    console.error("Error updating hair quiz:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/** Protected delete for admin CRUD. */
export async function DELETE(req: NextRequest) {
  try {
    if (!(await requireAdminSession())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = (await req.json()) as { id?: string };

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const result = await db
      .collection(COLLECTIONS.HAIR_QUIZ_FORMS)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Hair quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting hair quiz:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
