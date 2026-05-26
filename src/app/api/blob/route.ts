import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { del, put } from "@vercel/blob";
import { auth } from "@/lib/auth/auth";
import { DB_NAME } from "@/lib/db";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function isVercelBlobUrl(url: string): boolean {
  return url.includes("public.blob.vercel-storage.com");
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be 4 MB or smaller" }, { status: 400 });
    }
    const type = file.type;
    if (!ALLOWED.has(type)) {
      return NextResponse.json(
        { error: "Use JPEG, PNG, WebP, or GIF" },
        { status: 400 }
      );
    }

    const ext =
      type === "image/png" ? "png"
      : type === "image/webp" ? "webp"
      : type === "image/gif" ? "gif"
      : "jpg";

    const pathname = `${DB_NAME}/website/marketing/upload/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("POST /api/blob:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const url =
      typeof body === "object" &&
      body !== null &&
      typeof (body as { url?: unknown }).url === "string"
        ? (body as { url: string }).url
        : null;

    if (!url || !isVercelBlobUrl(url)) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    await del(url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/blob:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
