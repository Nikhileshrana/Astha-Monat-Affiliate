import { sendPlainEmail } from "@/lib/email";

const FORM_NOTIFICATION_EMAIL = process.env.FORM_NOTIFICATION_EMAIL?.trim() || "astha2891@gmail.com";

type FormContactDetails = {
  name: string;
  email: string;
  instagramUsername: string;
  phone: string;
  phoneLabel?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatInstagramHandle(value: string) {
  const handle = value.trim().replace(/^@+/, "");
  return handle ? `@${handle}` : value;
}

function buildContactEmailBody(
  formLabel: string,
  details: FormContactDetails,
) {
  const phoneLabel = details.phoneLabel ?? "Phone";
  const instagram = formatInstagramHandle(details.instagramUsername);

  const rows = [
    ["Name", details.name],
    ["Email", details.email],
    ["Instagram", instagram],
    [phoneLabel, details.phone],
  ];

  const text = [
    `New ${formLabel} submission`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-weight:600;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <h2 style="margin:0 0 16px;font-size:20px;">New ${escapeHtml(formLabel)} submission</h2>
      <table style="border-collapse:collapse;width:100%;max-width:560px;">
        ${htmlRows}
      </table>
    </div>
  `.trim();

  return { text, html };
}

async function sendFormContactNotification(
  formLabel: string,
  subject: string,
  details: FormContactDetails,
) {
  const { text, html } = buildContactEmailBody(formLabel, details);

  await sendPlainEmail({
    to: FORM_NOTIFICATION_EMAIL,
    subject,
    text,
    html,
  });
}

export async function notifyAffiliateApplicationSubmitted(details: {
  name: string;
  email: string;
  instagramUsername: string;
  phone: string;
}) {
  await sendFormContactNotification(
    "affiliate application",
    `New affiliate application — ${details.name}`,
    {
      ...details,
      phoneLabel: "Phone",
    },
  );
}

export async function notifyHairQuizSubmitted(details: {
  name: string;
  email: string;
  instagramUsername: string;
  whatsapp: string;
}) {
  await sendFormContactNotification(
    "custom hair plan quiz",
    `New hair plan quiz — ${details.name}`,
    {
      name: details.name,
      email: details.email,
      instagramUsername: details.instagramUsername,
      phone: details.whatsapp,
      phoneLabel: "WhatsApp",
    },
  );
}
