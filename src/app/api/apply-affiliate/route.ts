import { isValidPhoneNumber } from "libphonenumber-js";
import { ObjectId, type SortDirection } from "mongodb";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isAffiliateAdmin } from "@/lib/apply-affiliate/api-auth";
import { auth } from "@/lib/auth/auth";
import clientPromise, { COLLECTIONS, DB_NAME } from "@/lib/db";
import {
  buildSubmissionMeta,
  parseClientContext,
} from "@/lib/request-metadata";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_SKIP = 50_000;

const affiliateFormSchema = z
  .object({
    name: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().email("Enter a valid email"),
    instagramUsername: z.string().trim().min(1, "Instagram handle is required"),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .refine(
        (value) => isValidPhoneNumber(value),
        "Enter a valid phone number with country code",
      ),
    isOver18: z.enum(["yes", "no"]),
    currentOccupation: z
      .string()
      .trim()
      .min(1, "Please tell us what you currently do for a living"),
    aboutYourself: z
      .string()
      .trim()
      .min(1, "Please share a little about yourself"),
    whyOnlineWork: z
      .string()
      .trim()
      .min(1, "Please share why working online interests you"),
    lifeNeeds: z
      .array(
        z.enum([
          "additional_income",
          "like_minded_community",
          "time_freedom",
          "work_from_anywhere",
        ]),
      )
      .min(1, "Select at least one option"),
    isCoachable: z.enum(["true", "false"]),
    timeCommitment: z.enum(["1_2_hrs_day", "part_time", "full_time"]),
    monthlyIncomeGoal: z.enum([
      "100_500_cad",
      "500_1000_cad",
      "1000_2000_cad",
      "2500_5000_cad",
      "10000_plus",
    ]),
    startupBudget: z.enum(["200_250", "350", "500_800"]),
    discoverySource: z.enum([
      "new_follower",
      "have_been_following",
      "friend",
      "other",
    ]),
    discoverySourceOther: z.string().trim().optional(),
    contactPreference: z.enum(["call", "whatsapp", "instagram_message", "other"]),
    contactPreferenceOther: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isOver18 === "no") {
      ctx.addIssue({
        code: "custom",
        message: "You must be 18 years or older to apply",
        path: ["isOver18"],
      });
    }

    if (data.discoverySource === "other" && !data.discoverySourceOther?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Please specify how you came across this page",
        path: ["discoverySourceOther"],
      });
    }

    if (data.contactPreference === "other" && !data.contactPreferenceOther?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Please specify how you would like to be contacted",
        path: ["contactPreferenceOther"],
      });
    }
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

type AffiliateFormInput = z.infer<typeof affiliateFormSchema>;

function resolveSortField(sortBy: "createdAt" | "updatedAt" | "name") {
  return sortBy === "name" ? "formData.name" : sortBy;
}

function getDocumentSortValue(
  doc: Record<string, unknown>,
  sortField: string,
) {
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

function normalizeInstagramUsername(value: string) {
  return value.trim().replace(/^@+/, "");
}

function parseAffiliatePayload(body: unknown) {
  if (!body || typeof body !== "object") {
    return affiliateFormSchema.safeParse(body);
  }

  const data = body as Record<string, unknown>;
  return affiliateFormSchema.safeParse({
    ...data,
    instagramUsername:
      typeof data.instagramUsername === "string"
        ? normalizeInstagramUsername(data.instagramUsername)
        : data.instagramUsername,
    discoverySourceOther:
      typeof data.discoverySourceOther === "string"
        ? data.discoverySourceOther.trim() || undefined
        : undefined,
    contactPreferenceOther:
      typeof data.contactPreferenceOther === "string"
        ? data.contactPreferenceOther.trim() || undefined
        : undefined,
  });
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeDocument(doc: Record<string, unknown>) {
  return {
    _id: doc._id instanceof ObjectId ? doc._id.toString() : doc._id,
    formData: doc.formData,
    submissionMeta: doc.submissionMeta,
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
      { "formData.name": { $regex: pattern, $options: "i" } },
      { "formData.email": { $regex: pattern, $options: "i" } },
      { "formData.instagramUsername": { $regex: pattern, $options: "i" } },
      { "formData.phone": { $regex: pattern, $options: "i" } },
    ],
  };
}

async function requireAdminSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !(await isAffiliateAdmin(session.user?.email))) {
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
    const parsed = parseAffiliatePayload(formBody);

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

    const result = await db.collection(COLLECTIONS.AFFILIATE_APPLICATIONS).insertOne({
      formData: parsed.data,
      submissionMeta,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        message: "Affiliate application submitted successfully",
        id: result.insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error submitting affiliate application:", error);
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
    const collection = db.collection(COLLECTIONS.AFFILIATE_APPLICATIONS);

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
    const sortField = resolveSortField(sortBy);
    const sort = {
      [sortField]: sortDirection,
      _id: sortDirection,
    } as Record<string, SortDirection>;

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

      const cursorValue = getDocumentSortValue(cursorDoc, sortField);

      const cursorFilter =
        sortOrder === "desc"
          ? {
              $or: [
                { [sortField]: { $lt: cursorValue } },
                {
                  [sortField]: cursorValue,
                  _id: { $lt: new ObjectId(cursor) },
                },
              ],
            }
          : {
              $or: [
                { [sortField]: { $gt: cursorValue } },
                {
                  [sortField]: cursorValue,
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
    console.error("Error fetching affiliate applications:", error);
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
    const { id, ...rest } = body as { id?: string } & Partial<AffiliateFormInput>;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const parsed = parseAffiliatePayload(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const result = await db.collection(COLLECTIONS.AFFILIATE_APPLICATIONS).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          formData: parsed.data,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Affiliate application updated successfully" });
  } catch (error) {
    console.error("Error updating affiliate application:", error);
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
      .collection(COLLECTIONS.AFFILIATE_APPLICATIONS)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Affiliate application deleted successfully" });
  } catch (error) {
    console.error("Error deleting affiliate application:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
