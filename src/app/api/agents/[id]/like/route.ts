import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await db.like.findUnique({
    where: { userId_agentId: { userId: user.id, agentId: id } },
  });

  if (existing) {
    const [, updated] = await db.$transaction([
      db.like.delete({ where: { id: existing.id } }),
      db.agent.update({ where: { id }, data: { likeCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ liked: false, likes: updated.likeCount });
  }

  const [, updated] = await db.$transaction([
    db.like.create({ data: { userId: user.id, agentId: id } }),
    db.agent.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
  ]);
  if (agent.authorId !== user.id) {
    await db.notification.create({
      data: { type: "like", recipientId: agent.authorId, actorId: user.id, agentId: id },
    });
  }
  return NextResponse.json({ liked: true, likes: updated.likeCount });
}
