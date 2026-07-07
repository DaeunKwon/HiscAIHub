import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { fmtDate } from "@/lib/prompts";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const prompt = await db.prompt.findUnique({ where: { id } });
  if (!prompt) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "댓글을 입력해주세요." }, { status: 400 });

  const comment = await db.comment.create({
    data: { text, userId: user.id, promptId: id },
    include: { user: true },
  });

  if (prompt.authorId !== user.id) {
    await db.notification.create({
      data: { type: "comment", recipientId: prompt.authorId, actorId: user.id, promptId: id, commentText: text },
    });
  }

  return NextResponse.json({
    comment: {
      id: comment.id,
      name: comment.user.name,
      dept: comment.user.dept,
      ava: comment.user.name.charAt(0),
      date: fmtDate(comment.createdAt),
      text: comment.text,
    },
  });
}
