import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

function timeAgo(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const h = Math.floor(diffMs / 3600000);
  if (h < 1) return "방금 전";
  if (h < 24) return `${h}시간 전`;
  const days = Math.floor(h / 24);
  if (days === 1) return "어제";
  return `${days}일 전`;
}

// 활동 화면 = 받은 알림(내 에이전트에 달린 후기) + 내가 남긴 후기.
// 좋아요가 사라지면서 "내가 좋아요한 목록" 자리를 "내가 남긴 후기"가 대신한다.
// 저장 목록은 여기 넣지 않는다 — 비공개 북마크라 보드의 저장 탭에서만 본다.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [notifications, myReviews] = await Promise.all([
    db.notification.findMany({
      where: { recipientId: user.id },
      include: { actor: true, agent: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.review.findMany({
      where: { userId: user.id },
      include: { agent: { include: { author: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      actor: n.actor.name,
      ava: n.actor.name.charAt(0),
      title: n.agent?.name ?? "(삭제된 에이전트)",
      agentId: n.agentId,
      text: n.reviewText,
      time: timeAgo(n.createdAt),
    })),
    myReviews: myReviews.map((r) => ({
      id: r.id,
      agentId: r.agentId,
      title: r.agent.name,
      author: r.agent.author.name,
      dept: r.agent.author.dept,
      useCase: r.useCase,
      time: timeAgo(r.createdAt),
    })),
  });
}
