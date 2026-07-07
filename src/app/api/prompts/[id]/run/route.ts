import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

// 프롬프트 '실행'은 claude.ai 새 탭 딥링크(외부) — 여기서는 카운터만 증가.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const updated = await db.prompt.update({
    where: { id },
    data: { runCount: { increment: 1 } },
  });
  return NextResponse.json({ runs: updated.runCount });
}
