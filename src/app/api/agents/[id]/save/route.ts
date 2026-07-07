import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await db.save.findUnique({
    where: { userId_agentId: { userId: user.id, agentId: id } },
  });

  if (existing) {
    await db.save.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }
  await db.save.create({ data: { userId: user.id, agentId: id } });
  return NextResponse.json({ saved: true });
}
