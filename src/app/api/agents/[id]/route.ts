import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getAgentDTO } from "@/lib/agents";
import { recordAudit } from "@/lib/audit";
import { parseAgentBody } from "@/lib/agent-form";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dto = await getAgentDTO(id, user.id);
  if (!dto) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ agent: dto });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await db.agent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.authorId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = parseAgentBody(await req.json());
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { outputs, ...data } = parsed.data;

  // 산출물은 순서가 의미를 갖고 개수도 바뀌므로 개별 갱신 대신 통째로 갈아끼운다.
  await db.$transaction([
    db.agentOutput.deleteMany({ where: { agentId: id } }),
    db.agent.update({
      where: { id },
      data: { ...data, outputs: { create: outputs.map((o, i) => ({ ...o, order: i })) } },
    }),
  ]);

  await recordAudit({
    user,
    action: "agent_update",
    targetType: "agent",
    targetId: id,
    targetLabel: data.name,
  });

  const dto = await getAgentDTO(id, user.id);
  return NextResponse.json({ agent: dto });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await db.agent.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (existing.authorId !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  await db.agent.delete({ where: { id } });
  await recordAudit({
    user,
    action: "agent_delete",
    targetType: "agent",
    targetId: id,
    targetLabel: existing.name,
  });

  return NextResponse.json({ ok: true });
}
