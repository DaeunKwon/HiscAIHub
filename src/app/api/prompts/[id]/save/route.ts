import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

// 저장 = 비공개. 집계·알림 없음. 본인만 존재 여부를 조회.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const prompt = await db.prompt.findUnique({ where: { id } });
  if (!prompt) return NextResponse.json({ error: "not found" }, { status: 404 });

  const existing = await db.save.findUnique({
    where: { userId_promptId: { userId: user.id, promptId: id } },
  });

  if (existing) {
    await db.save.delete({ where: { id: existing.id } });
    return NextResponse.json({ saved: false });
  }
  await db.save.create({ data: { userId: user.id, promptId: id } });
  return NextResponse.json({ saved: true });
}
