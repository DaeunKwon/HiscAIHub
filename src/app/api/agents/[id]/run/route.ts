import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

// 에이전트 '실행'도 프롬프트와 동일하게 claude.ai 새 탭 딥링크(외부) — 여기서는 카운터+감사로그만 기록.
// 임직원이 각자 PC의 Claude를 직접 쓰도록 유도하는 것이 허브의 목적이라, 백엔드가 대신 처리·응답하지 않는다.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [updated] = await db.$transaction([
    db.agent.update({ where: { id }, data: { runCount: { increment: 1 } } }),
    db.auditLog.create({
      data: {
        userId: user.id,
        action: "agent_run",
        targetType: "agent",
        targetId: agent.id,
        targetLabel: agent.name,
        status: "success",
      },
    }),
  ]);

  return NextResponse.json({ runs: updated.runCount });
}
