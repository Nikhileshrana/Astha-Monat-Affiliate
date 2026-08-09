import { ObjectId } from "mongodb";
import { connection, type NextRequest, NextResponse } from "next/server";

import clientPromise, { COLLECTIONS, DB_NAME } from "@/lib/db";
import { sendTreatmentFollowUpEmail } from "@/lib/hair-quiz/follow-up-email";
import {
  normalizeAdminTracking,
  TREATMENT_FOLLOW_UP_EMAIL_DAYS,
} from "@/lib/hair-quiz/schema";
import { ensureHairQuizIndexes } from "@/lib/hair-quiz/server";

export const maxDuration = 60;

const BATCH_LIMIT = 40;

function isAuthorizedCron(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

function dueBeforeIso(days: number) {
  const due = new Date();
  due.setUTCDate(due.getUTCDate() - days);
  return due.toISOString();
}

/**
 * Daily cron: email people ~1 month after admin marks Treatment given.
 * Protect with CRON_SECRET (Vercel Cron sends Authorization: Bearer <CRON_SECRET>).
 */
export async function GET(req: NextRequest) {
  await connection();

  try {
    if (!isAuthorizedCron(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const collection = client.db(DB_NAME).collection(COLLECTIONS.HAIR_QUIZ_FORMS);
    await ensureHairQuizIndexes(collection);

    const dueBefore = dueBeforeIso(TREATMENT_FOLLOW_UP_EMAIL_DAYS);
    const now = new Date();

    const candidates = await collection
      .find({
        "adminTracking.treatmentStatus": "completed",
        "adminTracking.treatmentCompletedAt": { $lte: dueBefore },
        $or: [
          { "adminTracking.followUpEmailSentAt": { $exists: false } },
          { "adminTracking.followUpEmailSentAt": null },
        ],
        "formData.email": { $type: "string", $ne: "" },
      })
      .sort({ "adminTracking.treatmentCompletedAt": 1 })
      .limit(BATCH_LIMIT)
      .toArray();

    let sent = 0;
    let skipped = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const doc of candidates) {
      const id = String(doc._id);
      const formData = (doc.formData ?? {}) as {
        name?: string;
        email?: string;
      };
      const email = typeof formData.email === "string" ? formData.email.trim() : "";
      const name = typeof formData.name === "string" ? formData.name.trim() : "there";

      if (!email) {
        skipped += 1;
        continue;
      }

      try {
        await sendTreatmentFollowUpEmail({ name, email });

        const adminTracking = normalizeAdminTracking(doc.adminTracking);
        adminTracking.followUpEmailSentAt = now.toISOString();

        await collection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              adminTracking,
              updatedAt: now,
            },
          },
        );

        sent += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown send error";
        console.error(`Hair quiz follow-up email failed for ${id}:`, error);
        errors.push({ id, error: message });
      }
    }

    return NextResponse.json({
      ok: true,
      dueBefore,
      scanned: candidates.length,
      sent,
      skipped,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    console.error("Hair quiz follow-up cron failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
