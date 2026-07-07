import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { getUsageStats, setPerUserDailyLimit } from "@/lib/admin";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const stats = await getUsageStats();
  return NextResponse.json(stats);
}

export async function PUT(req: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const limit = Number(body.limit);
  if (!Number.isFinite(limit) || limit <= 0) {
    return NextResponse.json({ error: "올바른 한도 값을 입력해주세요." }, { status: 400 });
  }

  await setPerUserDailyLimit(Math.floor(limit));
  return NextResponse.json({ ok: true });
}
