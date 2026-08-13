// 에이전트 도메인 데이터 계층 — DB ↔ 프런트 DTO 변환.
// 목업(design-reference/agent_hub_v3_mockup.html)의 agents 배열 형태에 맞춘다.
import { db } from "./db";
import type { Prisma, RunType, TimeBand } from "@prisma/client";
import { savedPct } from "./time-band";

// 실제로 존재하지 않을 cuid — 비로그인/조회 전용 컨텍스트에서 saves를 빈 배열로 만들기 위한 sentinel.
const NONE = "__none__";

export function fmtDate(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export type ReviewDTO = {
  id: string;
  name: string;
  dept: string;
  ava: string;
  date: string;
  useCase: string | null;
  effect: string;
  timeBefore: TimeBand | null;
  timeAfter: TimeBand | null;
  savedPct: number | null;
  mine: boolean;
};

export type OutputDTO = { id: string; src: string; caption: string };

export type AgentDTO = {
  id: string;
  cat: string;
  date: string;
  name: string;
  desc: string;

  runType: RunType;
  trigger: string;

  targetTask: string;
  tasks: string[];
  tools: string[];

  effect: string;
  timeBefore: TimeBand | null;
  timeAfter: TimeBand | null;
  savedPct: number | null;

  prerequisites: string[];
  howToUse: string[];
  instructions: string;
  linkUrl: string | null;

  author: string;
  dept: string;
  ava: string;
  official: boolean;
  runs: number;
  saved: boolean;
  mine: boolean;

  outputs: OutputDTO[];
  reviews: ReviewDTO[];
};

function agentInclude(userId: string | null) {
  return {
    author: true,
    outputs: { orderBy: { order: "asc" as const } },
    reviews: { include: { user: true }, orderBy: { createdAt: "asc" as const } },
    saves: { where: { userId: userId ?? NONE } },
  } satisfies Prisma.AgentInclude;
}

type LoadedAgent = Prisma.AgentGetPayload<{ include: ReturnType<typeof agentInclude> }>;

export function serializeReview(
  r: LoadedAgent["reviews"][number],
  userId: string | null,
): ReviewDTO {
  return {
    id: r.id,
    name: r.user.name,
    dept: r.user.dept,
    ava: r.user.name.charAt(0),
    date: fmtDate(r.createdAt),
    useCase: r.useCase,
    effect: r.effect,
    timeBefore: r.timeBefore,
    timeAfter: r.timeAfter,
    savedPct: savedPct(r.timeBefore, r.timeAfter),
    mine: userId != null && r.userId === userId,
  };
}

function serializeAgent(a: LoadedAgent, userId: string | null): AgentDTO {
  return {
    id: a.id,
    cat: a.category,
    date: fmtDate(a.createdAt),
    name: a.name,
    desc: a.description,

    runType: a.runType,
    trigger: a.trigger,

    targetTask: a.targetTask,
    tasks: a.tasks,
    tools: a.tools,

    effect: a.effect,
    timeBefore: a.timeBefore,
    timeAfter: a.timeAfter,
    savedPct: savedPct(a.timeBefore, a.timeAfter),

    prerequisites: a.prerequisites,
    howToUse: a.howToUse,
    instructions: a.instructions,
    linkUrl: a.linkUrl,

    author: a.author.name,
    dept: a.author.dept,
    ava: a.author.name.charAt(0),
    official: a.official,
    runs: a.runCount,
    saved: a.saves.length > 0,
    mine: userId != null && a.authorId === userId,

    outputs: a.outputs.map((o) => ({ id: o.id, src: o.src, caption: o.caption })),
    reviews: a.reviews.map((r) => serializeReview(r, userId)),
  };
}

export async function listAgents(userId: string | null): Promise<AgentDTO[]> {
  const agents = await db.agent.findMany({
    where: { OR: [{ status: "published" }, ...(userId ? [{ authorId: userId }] : [])] },
    include: agentInclude(userId),
    orderBy: { createdAt: "desc" },
  });
  return agents.map((a) => serializeAgent(a, userId));
}

export async function getAgentDTO(id: string, userId: string | null): Promise<AgentDTO | null> {
  const a = await db.agent.findUnique({ where: { id }, include: agentInclude(userId) });
  if (!a) return null;
  return serializeAgent(a, userId);
}
