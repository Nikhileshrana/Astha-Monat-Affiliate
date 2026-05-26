import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || process.env.RESEND_API;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM = "Astha Rana<updates@asthahairexpert.com>";

export type TemplateVariables = Record<string, string | number>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractSendError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "Unknown email provider error";
}

/**
 * Send a Resend templated email with one automatic retry.
 * Throws if the email service is unconfigured or all attempts fail.
 */
export async function sendTemplatedEmail(opts: {
  to: string;
  subject: string;
  templateId: string;
  variables: TemplateVariables;
}): Promise<void> {
  if (!resend) {
    throw new Error(
      "Email service is not configured. Missing RESEND_API_KEY/RESEND_API.",
    );
  }
  if (!opts.templateId) {
    throw new Error("Missing Resend template ID for this email flow.");
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await resend.emails.send({
        from: FROM,
        to: opts.to,
        subject: opts.subject,
        template: {
          id: opts.templateId,
          variables: opts.variables,
        },
      });
      if (result.error) {
        throw new Error(result.error.message || "Resend reported a send error");
      }
      return;
    } catch (err) {
      lastError = err;
      console.error(`Template email attempt ${attempt}/2 failed:`, err);
      if (attempt < 2) await sleep(300);
    }
  }

  throw new Error(
    `Email delivery failed after retries: ${extractSendError(lastError)}`,
  );
}
