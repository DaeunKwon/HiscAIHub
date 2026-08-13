import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { serializeReview } from "@/lib/agents";
import { parseTimeBand } from "@/lib/time-band";

// 활용 후기 — "어떤 업무에 썼는지 + 효과 + 도입 전/후 소요시간".
// 남긴 시간 구간은 전사 절감 시간 집계에 반영되므로, 효과만 필수로 받고 나머지는 선택으로 둔다.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agent = await db.agent.findUnique({ where: { id } });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const effect = String(body.effect ?? "").trim();
  if (!effect) return NextResponse.json({ error: "어떤 효과가 있었는지 입력해주세요." }, { status: 400 });

  const useCase = String(body.useCase ?? "").trim() || null;

  const review = await db.review.create({
    data: {
      agentId: id,
      userId: user.id,
      useCase,
      effect,
      timeBefore: parseTimeBand(body.timeBefore),
      timeAfter: parseTimeBand(body.timeAfter),
    },
    include: { user: true },
  });

  // 자기 에이전트에 자기가 남긴 후기로 자기한테 알림이 가지 않도록 한다.
  if (agent.authorId !== user.id) {
    await db.notification.create({
      data: {
        type: "review",
        recipientId: agent.authorId,
        actorId: user.id,
        agentId: id,
        reviewText: useCase ?? effect,
      },
    });
  }

  return NextResponse.json({ review: serializeReview(review, user.id) }, { status: 201 });
}
