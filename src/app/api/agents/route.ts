import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getAgentDTO, listAgents } from "@/lib/agents";
import { recordAudit } from "@/lib/audit";
import { parseAgentBody } from "@/lib/agent-form";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const agents = await listAgents(user.id);
  return NextResponse.json({ agents });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = parseAgentBody(await req.json());
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { outputs, ...data } = parsed.data;

  const created = await db.agent.create({
    data: {
      ...data,
      authorId: user.id,
      outputs: { create: outputs.map((o, i) => ({ ...o, order: i })) },
    },
  });

  await recordAudit({
    user,
    action: "agent_create",
    targetType: "agent",
    targetId: created.id,
    targetLabel: created.name,
  });

  const dto = await getAgentDTO(created.id, user.id);
  return NextResponse.json({ agent: dto }, { status: 201 });
}
