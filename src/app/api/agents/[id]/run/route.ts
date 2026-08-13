import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { auditCreate } from "@/lib/audit";

// 에이전트 '가져다 쓰기'는 claude.ai 딥링크·설치 안내 등 외부에서 이뤄진다 — 여기서는 카운터+감사로그만 기록.
// 임직원이 각자 PC의 Claude를 직접 쓰도록 유도하는 것이 허브의 목적이라, 백엔드가 대신 처리·응답하지 않는다.
//
// 이 로그가 대시보드 부서 확산 지표의 유일한 원천이다. deptSnapshot(실행 시점 부서)과
// targetId(=agentId)가 함께 남아야 "어느 팀이 어떤 에이전트를 가져갔는지" 행렬이 만들어진다.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [updated] = await db.$transaction([
    db.agent.update({ where: { id }, data: { runCount: { increment: 1 } } }),
    auditCreate({
      user,
      action: "agent_run",
      targetType: "agent",
      targetId: agent.id,
      targetLabel: agent.name,
    }),
  ]);

  return NextResponse.json({ runs: updated.runCount });
}
