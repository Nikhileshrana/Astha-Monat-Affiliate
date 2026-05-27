import geoip from "geoip-lite";
import type { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";

type ClientContext = {
  language?: string;
  languages?: string[];
  platform?: string;
  screen?: string;
  viewport?: string;
  timezone?: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  touchPoints?: number;
};

function header(req: NextRequest, name: string) {
  return req.headers.get(name) ?? undefined;
}

function firstIp(value: string | undefined) {
  if (!value) return undefined;
  const ip = value.split(",")[0]?.trim();
  return ip || undefined;
}

function resolveIp(req: NextRequest) {
  return (
    firstIp(header(req, "x-forwarded-for")) ??
    header(req, "x-real-ip") ??
    header(req, "cf-connecting-ip") ??
    header(req, "x-vercel-forwarded-for") ??
    null
  );
}

function isPrivateIp(ip: string | null) {
  if (!ip) return true;
  if (ip === "::1" || ip === "127.0.0.1") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.") || ip.startsWith("172.")) {
    return true;
  }
  return false;
}

function readVercelGeo(req: NextRequest) {
  const country = header(req, "x-vercel-ip-country");
  const region = header(req, "x-vercel-ip-country-region");
  const city = header(req, "x-vercel-ip-city");
  const latitude = header(req, "x-vercel-ip-latitude");
  const longitude = header(req, "x-vercel-ip-longitude");
  const timezone = header(req, "x-vercel-ip-timezone");

  if (!country && !region && !city && !latitude && !longitude && !timezone) {
    return null;
  }

  return {
    country,
    region,
    city,
    latitude,
    longitude,
    timezone,
    source: "vercel" as const,
  };
}

function readCloudflareGeo(req: NextRequest) {
  const country = header(req, "cf-ipcountry");
  if (!country) return null;

  return {
    country,
    region: header(req, "cf-region"),
    city: header(req, "cf-ipcity"),
    latitude: header(req, "cf-iplatitude"),
    longitude: header(req, "cf-iplongitude"),
    timezone: header(req, "cf-timezone"),
    source: "cloudflare" as const,
  };
}

function readGeoIpLite(ip: string | null) {
  if (!ip || isPrivateIp(ip)) return null;

  const lookup = geoip.lookup(ip);
  if (!lookup) return null;

  return {
    country: lookup.country,
    region: lookup.region,
    city: lookup.city,
    latitude: lookup.ll?.[0]?.toString(),
    longitude: lookup.ll?.[1]?.toString(),
    timezone: lookup.timezone,
    source: "geoip-lite" as const,
  };
}

function readClientHints(req: NextRequest) {
  const hints: Record<string, string> = {};
  const keys = [
    "sec-ch-ua",
    "sec-ch-ua-mobile",
    "sec-ch-ua-platform",
    "sec-ch-ua-platform-version",
    "sec-ch-ua-model",
    "sec-ch-ua-full-version-list",
    "sec-ch-prefers-color-scheme",
  ] as const;

  for (const key of keys) {
    const value = header(req, key);
    if (value) hints[key] = value;
  }

  return Object.keys(hints).length > 0 ? hints : undefined;
}

function parseUserAgent(userAgent: string | null | undefined) {
  if (!userAgent) {
    return {
      browser: undefined,
      engine: undefined,
      os: undefined,
      device: undefined,
      cpu: undefined,
    };
  }

  const parsed = new UAParser(userAgent).getResult();
  return {
    browser: parsed.browser.name
      ? { name: parsed.browser.name, version: parsed.browser.version }
      : undefined,
    engine: parsed.engine.name
      ? { name: parsed.engine.name, version: parsed.engine.version }
      : undefined,
    os: parsed.os.name
      ? { name: parsed.os.name, version: parsed.os.version }
      : undefined,
    device: parsed.device.type || parsed.device.vendor || parsed.device.model
      ? {
          type: parsed.device.type,
          vendor: parsed.device.vendor,
          model: parsed.device.model,
        }
      : undefined,
    cpu: parsed.cpu.architecture ? { architecture: parsed.cpu.architecture } : undefined,
  };
}

export function buildSubmissionMeta(
  req: NextRequest,
  clientContext?: ClientContext,
) {
  const ip = resolveIp(req);
  const userAgent = header(req, "user-agent") ?? null;
  const geo =
    readVercelGeo(req) ?? readCloudflareGeo(req) ?? readGeoIpLite(ip) ?? undefined;

  return {
    capturedAt: new Date().toISOString(),
    ip,
    geo,
    device: parseUserAgent(userAgent),
    userAgent,
    acceptLanguage: header(req, "accept-language") ?? null,
    referer: header(req, "referer") ?? null,
    origin: header(req, "origin") ?? null,
    host: header(req, "host") ?? null,
    clientHints: readClientHints(req),
    clientContext: clientContext ?? undefined,
  };
}

export type SubmissionMeta = ReturnType<typeof buildSubmissionMeta>;

export function parseClientContext(value: unknown): ClientContext | undefined {
  if (!value || typeof value !== "object") return undefined;

  const data = value as Record<string, unknown>;
  const context: ClientContext = {};

  if (typeof data.language === "string") context.language = data.language;
  if (Array.isArray(data.languages)) {
    context.languages = data.languages.filter(
      (item): item is string => typeof item === "string",
    );
  }
  if (typeof data.platform === "string") context.platform = data.platform;
  if (typeof data.screen === "string") context.screen = data.screen;
  if (typeof data.viewport === "string") context.viewport = data.viewport;
  if (typeof data.timezone === "string") context.timezone = data.timezone;
  if (typeof data.deviceMemory === "number") context.deviceMemory = data.deviceMemory;
  if (typeof data.hardwareConcurrency === "number") {
    context.hardwareConcurrency = data.hardwareConcurrency;
  }
  if (typeof data.touchPoints === "number") context.touchPoints = data.touchPoints;

  return Object.keys(context).length > 0 ? context : undefined;
}
