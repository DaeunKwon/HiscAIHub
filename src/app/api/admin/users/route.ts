import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { listUsersAdmin } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const users = await listUsersAdmin();
  return NextResponse.json({ users });
}
