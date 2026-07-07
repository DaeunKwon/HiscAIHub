import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { listPendingReports } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const reports = await listPendingReports();
  return NextResponse.json({ reports });
}
