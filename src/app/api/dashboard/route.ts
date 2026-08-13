import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getDashboardData, normalizePeriod } from "@/lib/dashboard";

// 관리자 전용이 아니다 — 임직원이면 누구나 같은 화면을 본다(기획서 4.7).
// 로그인만 확인하고 역할은 보지 않는다.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const period = normalizePeriod(new URL(req.url).searchParams.get("days"));
  const data = await getDashboardData(period);
  return NextResponse.json(data);
}
