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

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const notifications = await db.notification.findMany({
    where: { recipientId: user.id },
    include: { actor: true, prompt: true, agent: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const myLikes = await db.like.findMany({
    where: { userId: user.id, OR: [{ promptId: { not: null } }, { agentId: { not: null } }] },
    include: {
      prompt: { include: { author: true } },
      agent: { include: { author: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      actor: n.actor.name,
      ava: n.actor.name.charAt(0),
      title: n.prompt?.title ?? n.agent?.name ?? "",
      promptId: n.promptId,
      agentId: n.agentId,
      text: n.commentText,
      time: timeAgo(n.createdAt),
    })),
    myLikes: myLikes
      .map((l) => {
        if (l.prompt) {
          return { kind: "prompt" as const, id: l.promptId as string, title: l.prompt.title, author: l.prompt.author.name, dept: l.prompt.author.dept };
        }
        if (l.agent) {
          return { kind: "agent" as const, id: l.agentId as string, title: l.agent.name, author: l.agent.author.name, dept: l.agent.author.dept };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
  });
}
