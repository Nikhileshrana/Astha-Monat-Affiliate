import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import clientPromise, { DB_NAME, COLLECTIONS } from "@/lib/db";
import { ADMIN_EMAIL } from "@/lib/routes";
import { auth } from "@/lib/auth/auth";
import { hasRouteAccess } from "@/lib/access-control";

async function isAuthorized(email: string | undefined): Promise<boolean> {
  if (!email) return false;
  if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;
  return await hasRouteAccess(email.toLowerCase(), "/protected/accessManagement");
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session || !(await isAuthorized(session.user?.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const client = await clientPromise;
    const db = client.db(DB_NAME);

    const query: any = {};
    if (search) {
      query.email = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db.collection(COLLECTIONS.SOFTWARE_ACCESS).find(query).skip(skip).limit(limit).toArray(),
      db.collection(COLLECTIONS.SOFTWARE_ACCESS).countDocuments(query)
    ]);

    const pageCount = Math.ceil(total / limit);

    return NextResponse.json({ users, total, pageCount, page, limit });
  } catch (error) {
    console.error("Error fetching access management:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session || !(await isAuthorized(session.user?.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, routes } = await req.json();

    if (!email || !Array.isArray(routes)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Upsert the user's route access
    await db.collection(COLLECTIONS.SOFTWARE_ACCESS).updateOne(
      { email: normalizedEmail },
      { 
        $set: { 
          email: normalizedEmail,
          routes: routes,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ message: "Access updated successfully" });
  } catch (error) {
    console.error("Error modifying access:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });
    
    if (!session || !(await isAuthorized(session.user?.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    await db.collection(COLLECTIONS.SOFTWARE_ACCESS).deleteOne({ email: normalizedEmail });

    return NextResponse.json({ message: "Revoked all access successfully" });
  } catch (error) {
    console.error("Error revoking access:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
