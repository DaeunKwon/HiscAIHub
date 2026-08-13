import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { getLatestSubscriptions, listSubscriptionPeriods } from "@/lib/subscriptions";

// 구독 현황도 전 임직원 공개(기획서 4.7).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [subscriptions, periods] = await Promise.all([
    getLatestSubscriptions(),
    listSubscriptionPeriods(),
  ]);
  return NextResponse.json({ subscriptions, periods });
}
