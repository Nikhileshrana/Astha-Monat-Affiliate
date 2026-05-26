"use server"
import client, { DB_NAME, COLLECTIONS } from "@/lib/db";
import { headers } from "next/headers";
import { auth } from "./auth";

export async function checkPhoneAndSendOtp(phone: string) {
  try {
    const db = client.db(DB_NAME);

    const user = await db.collection(COLLECTIONS.USERS_COLLECTION).findOne({
      phoneNumber: phone,
    });
    
    if (!user) {
      return { success: false, error: "No account found with this phone number." };
    }

    if (!user.email) {
      return { success: false, error: "User does not have an associated email address." };
    }

    // Use Better Auth's internal API to generate and send the OTP to their email
    // This calls the sendVerificationOTP function we defined in auth.ts
    await auth.api.sendVerificationOTP({
      body: {
        email: user.email,
        type: "sign-in"
      },
      headers: await headers()
    });

    // Mask the email beautifully for display purposes
    const [namePart, domainPart] = user.email.split("@");
    const maskedNameId = namePart.length > 3
      ? namePart.substring(0, 3) + "***"
      : namePart.substring(0, 1) + "***";
    const maskedEmail = `${maskedNameId}@${domainPart}`;

    return {
      success: true,
      maskedEmail,
      email: user.email // Returned to the client to finalize the OTP check
    };
  } catch (error: any) {
    console.error("Phone OTP trigger error:", error);
    return { success: false, error: error.message || "Mail not sent. Server is busy." };
  }
}

export async function signUpWithPhoneAndEmailOTP(name: string, email: string, phone: string) {
  try {
    const db = client.db(DB_NAME);
    const normalizedPhone = String(phone ?? "").replace(/\D/g, "").slice(-10);
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedName = String(name ?? "").trim();

    if (normalizedPhone.length !== 10) {
      return { success: false, error: "Please enter a valid 10-digit phone number." };
    }
    if (!normalizedEmail) {
      return { success: false, error: "Please enter a valid email." };
    }
    if (!normalizedName) {
      return { success: false, error: "Please enter your name." };
    }

    // Ensure no user exists with this phone or email
    const existingByPhone = await db.collection(COLLECTIONS.USERS_COLLECTION).findOne({ phoneNumber: normalizedPhone });
    if (existingByPhone) {
      return { success: false, error: "Phone number is already registered." };
    }
    const existingByEmail = await db.collection(COLLECTIONS.USERS_COLLECTION).findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return { success: false, error: "Email is already registered." };
    }

    // We simply trigger the OTP here without creating the user.
    // Better Auth's signInEmailOTP will automatically create the user safely if the OTP is correct!
    await auth.api.sendVerificationOTP({
      body: {
        email: normalizedEmail,
        type: "sign-in"
      },
      headers: await headers()
    });

    return { success: true };
  } catch (e: any) {
    console.error("Signup error:", e);
    return { success: false, error: e.message || e?.body?.message || "Mail not sent. Server is busy." };
  }
}