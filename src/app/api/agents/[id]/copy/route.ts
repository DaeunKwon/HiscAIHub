import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { recordAudit } from "@/lib/audit";

// "정의 복사" — 실행(가져다 쓰기)과 구분해서 기록한다.
// 복사는 실행 카운터를 올리지 않는다. 정의만 보고 참고한 것과 실제로 도입한 것은 다른 행위이고,
// 둘을 섞으면 실행 지표가 부풀려진다.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  await recordAudit({
    user,
    action: "agent_copy",
    targetType: "agent",
    targetId: agent.id,
    targetLabel: agent.name,
  });

  return NextResponse.json({ ok: true });
}
