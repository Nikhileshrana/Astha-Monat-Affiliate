import { parsePhoneNumber } from "libphonenumber-js";
import { toast } from "sonner";

const OUTREACH_MESSAGE = "Hello! This is Astha! 💜😊";

export function buildWhatsAppUrl(phone: string) {
  try {
    const parsed = parsePhoneNumber(phone);
    const digits = parsed?.format("E.164").replace(/\D/g, "") ?? phone.replace(/\D/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(OUTREACH_MESSAGE)}`;
  } catch {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(OUTREACH_MESSAGE)}`;
  }
}

export function normalizeInstagramHandle(username: string) {
  return username.trim().replace(/^@+/, "");
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function buildInstagramMobileUrl(username: string) {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return null;
  return `https://ig.me/m/${handle}?text=${encodeURIComponent(OUTREACH_MESSAGE)}`;
}

function buildInstagramWebUrl(username: string) {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return null;
  return `https://www.instagram.com/${handle}/`;
}

export function openInstagramMessage(username: string) {
  const handle = normalizeInstagramHandle(username);
  if (!handle) return;

  if (isMobileDevice()) {
    const url = buildInstagramMobileUrl(handle);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const profileUrl = buildInstagramWebUrl(handle);
  if (!profileUrl) return;

  void navigator.clipboard
    .writeText(OUTREACH_MESSAGE)
    .then(() => {
      toast.success("Message copied. Tap Message on their profile to paste.");
    })
    .catch(() => {
      toast.message(`Open their profile and send: ${OUTREACH_MESSAGE}`);
    });

  window.open(profileUrl, "_blank", "noopener,noreferrer");
}

export function getInstagramOutreachTitle() {
  return isMobileDevice()
    ? "Message on Instagram"
    : "Open Instagram profile (message copied to clipboard)";
}
