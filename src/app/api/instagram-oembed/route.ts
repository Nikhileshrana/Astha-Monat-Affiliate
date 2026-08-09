import { connection, type NextRequest, NextResponse } from "next/server";

const INSTAGRAM_URL_PATTERN =
  /^https:\/\/(www\.)?instagram\.com\/(reel|reels|p|tv)\/[A-Za-z0-9_-]+\/?(\?.*)?$/;

function normalizeInstagramPostUrl(url: string) {
  const parsed = new URL(url);
  parsed.pathname = parsed.pathname.replace(/^\/reels\//, "/reel/");
  if (!parsed.pathname.endsWith("/")) {
    parsed.pathname = `${parsed.pathname}/`;
  }
  return parsed.toString();
}

function buildInstagramBlockquote(permalink: string) {
  return `<blockquote class="instagram-media" data-instgrm-permalink="${permalink}" data-instgrm-version="14" style="background:#FFF;border:0;border-radius:12px;margin:0;max-width:540px;min-width:326px;padding:0;width:100%;"><div style="padding:16px;"><a href="${permalink}" style="background:#FFFFFF;line-height:0;padding:0;text-align:center;text-decoration:none;width:100%;" target="_blank" rel="noopener noreferrer"><div style="padding-top:8px;"><div style="color:#3897f0;font-family:Arial,sans-serif;font-size:14px;font-weight:550;line-height:18px;">View this reel on Instagram</div></div></a></div></blockquote>`;
}

async function fetchGraphOembed(permalink: string) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) return null;

  const graphUrl = new URL("https://graph.facebook.com/v22.0/instagram_oembed");
  graphUrl.searchParams.set("url", permalink);
  graphUrl.searchParams.set("access_token", `${appId}|${appSecret}`);
  graphUrl.searchParams.set("omitscript", "true");
  graphUrl.searchParams.set("maxwidth", "540");
  graphUrl.searchParams.set("hidecaption", "true");

  const response = await fetch(graphUrl.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as { html?: string };
  return payload.html ? payload : null;
}

export async function GET(req: NextRequest) {
  await connection();

  try {
    const rawUrl = req.nextUrl.searchParams.get("url")?.trim();

    if (!rawUrl || !INSTAGRAM_URL_PATTERN.test(rawUrl)) {
      return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    }

    const permalink = normalizeInstagramPostUrl(rawUrl);
    const graphPayload = await fetchGraphOembed(permalink);

    if (graphPayload) {
      return NextResponse.json(graphPayload);
    }

    return NextResponse.json({
      version: "1.0",
      provider_name: "Instagram",
      provider_url: "https://www.instagram.com/",
      type: "rich",
      width: 540,
      html: buildInstagramBlockquote(permalink),
    });
  } catch (error) {
    console.error("Instagram oEmbed error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
