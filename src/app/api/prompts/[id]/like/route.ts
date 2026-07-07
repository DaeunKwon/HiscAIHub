import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

// 좋아요 = 공개. 토글 시 likeCount 갱신 + 대상 작성자에게 알림 생성(본인 글 제외).
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const prompt = await db.prompt.findUnique({ where: { id } });
  if (!prompt) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await db.like.findUnique({
    where: { userId_promptId: { userId: user.id, promptId: id } },
  });

  if (existing) {
    const [, updated] = await db.$transaction([
      db.like.delete({ where: { id: existing.id } }),
      db.prompt.update({ where: { id }, data: { likeCount: { decrement: 1 } } }),
    ]);
    return NextResponse.json({ liked: false, likes: updated.likeCount });
  }

  const [, updated] = await db.$transaction([
    db.like.create({ data: { userId: user.id, promptId: id } }),
    db.prompt.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
  ]);
  if (prompt.authorId !== user.id) {
    await db.notification.create({
      data: { type: "like", recipientId: prompt.authorId, actorId: user.id, promptId: id },
    });
  }
  return NextResponse.json({ liked: true, likes: updated.likeCount });
}
