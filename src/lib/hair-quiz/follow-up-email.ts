import { sendPlainEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function firstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "there";
}

/**
 * Warm 1-month check-in from Astha after treatment was given.
 */
export async function sendTreatmentFollowUpEmail(details: {
  name: string;
  email: string;
}) {
  const name = firstName(details.name);

  const text = [
    `Hi ${name},`,
    "",
    "It’s Astha here 💜",
    "",
    "It’s been about a month since we last talked about your hair plan, and I’ve been thinking about you.",
    "How are the products feeling? Have you noticed any little improvements — softness, less breakage, fuller-looking hair, or just a better wash day?",
    "",
    "I’d truly love to hear how it’s going for you. Even a short reply means a lot.",
    "If something isn’t clicking yet, tell me that too — we can tweak things together.",
    "",
    "Take care,",
    "Astha",
  ].join("\n");

  const html = `
    <div style="font-family:Georgia,serif;line-height:1.65;color:#1f1f1f;max-width:560px;">
      <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 16px;">It’s Astha here 💜</p>
      <p style="margin:0 0 16px;">
        It’s been about a month since we last talked about your hair plan, and I’ve been thinking about you.
        How are the products feeling? Have you noticed any little improvements — softness, less breakage,
        fuller-looking hair, or just a better wash day?
      </p>
      <p style="margin:0 0 16px;">
        I’d truly love to hear how it’s going for you. Even a short reply means a lot.
        If something isn’t clicking yet, tell me that too — we can tweak things together.
      </p>
      <p style="margin:0;">
        Take care,<br />
        Astha
      </p>
    </div>
  `.trim();

  await sendPlainEmail({
    to: details.email,
    subject: `${name}, quick check-in from Astha 💜`,
    text,
    html,
  });
}
