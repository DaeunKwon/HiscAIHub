import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getAgentDTO, listAgents } from "@/lib/agents";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const agents = await listAgents(user.id);
  return NextResponse.json({ agents });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const description = String(body.desc ?? "").trim() || "(설명 없음)";
  const instructions = String(body.instructions ?? "").trim();
  const category = String(body.cat ?? "").trim() || "리서치";
  const tasks = Array.isArray(body.tasks)
    ? body.tasks.map((t: unknown) => String(t).trim()).filter(Boolean)
    : [];

  if (!name || !instructions) {
    return NextResponse.json({ error: "에이전트 이름과 지침을 입력해주세요." }, { status: 400 });
  }

  const created = await db.agent.create({
    data: { name, description, instructions, exampleTasks: tasks, category, authorId: user.id },
  });
  const dto = await getAgentDTO(created.id, user.id);
  return NextResponse.json({ agent: dto }, { status: 201 });
}
