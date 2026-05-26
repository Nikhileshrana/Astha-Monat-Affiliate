import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { emailOTP } from "better-auth/plugins";
import client, { DB_NAME, COLLECTIONS } from "@/lib/db";
import { sendTemplatedEmail } from "@/lib/email";

const APP_NAME = "AI PMS";
const OTP_TEMPLATE_ID = process.env.RESEND_TEMPLATE_OTP_ID?.trim() || "otp-mail";

export const auth = betterAuth({
    database: mongodbAdapter(client.db(DB_NAME)),
    rateLimit: {
        enabled: true,
        // Global cap (per IP). Keep generous: navigation + useSession() hit auth often.
        window: 60,
        max: 200,
        // Session reads are not brute-force targets; middleware calls this every protected request.
        customRules: {
            "/get-session": false,
        },
    },
    user: {
        modelName: COLLECTIONS.USERS_COLLECTION,
        additionalFields: {
            phoneNumber: {
                type: "string",
                required: false,
            }
        }
    },
    // OTP-only auth flow (no password-based sign in/up).
    emailAndPassword: {
        enabled: false,
    },
    plugins: [
        emailOTP({
            async sendVerificationOTP({ email, otp, type }) {
                try {
                    const otpAsNumber = Number(otp);
                    if (!Number.isFinite(otpAsNumber)) {
                        throw new Error("Generated OTP is invalid");
                    }
                    await sendTemplatedEmail({
                        to: email,
                        subject: `Your verification code — ${APP_NAME}`,
                        templateId: OTP_TEMPLATE_ID,
                        variables: {
                            otp: otpAsNumber,
                            APP_NAME,
                            FLOW: type,
                        },
                    });
                    console.log("OTP email sent to:", email);
                } catch (e) {
                    console.error("Failed to send OTP via Resend:", e);
                    // Propagate so the caller knows OTP was not delivered.
                    throw new Error("Unable to deliver verification email. Please try again.");
                }
            }
        }),
        nextCookies()
    ]
});
