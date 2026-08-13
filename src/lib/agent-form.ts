// 에이전트 등록·수정 폼 본문 파싱. 생성과 수정이 같은 규칙을 써야 해서 한곳에 둔다.
import type { Prisma, RunType } from "@prisma/client";
import { parseTimeBand } from "@/lib/time-band";

const RUN_TYPES: RunType[] = ["schedule", "event", "skill", "app"];

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => str(x)).filter(Boolean) : [];
}

function parseOutputs(v: unknown): { src: string; caption: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((o) => ({
      src: str((o as Record<string, unknown>)?.src),
      caption: str((o as Record<string, unknown>)?.caption),
    }))
    .filter((o) => o.src);
}

type AgentFields = Omit<Prisma.AgentUncheckedCreateInput, "id" | "authorId" | "outputs"> & {
  outputs: { src: string; caption: string }[];
};

export function parseAgentBody(body: unknown): { data: AgentFields } | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = str(b.name);
  const instructions = str(b.instructions);
  const category = str(b.cat);
  const runType = RUN_TYPES.find((t) => t === b.runType);
  const targetTask = str(b.targetTask);
  const effect = str(b.effect);
  const trigger = str(b.trigger);
  const tasks = strList(b.tasks);

  // 필수값 — 카테고리와 실행 방식이 없으면 대시보드의 업무유형·확산 집계가 성립하지 않는다.
  if (!name) return { error: "에이전트 이름을 입력해주세요." };
  if (!category) return { error: "업무 카테고리를 선택해주세요." };
  if (!runType) return { error: "실행 방식을 선택해주세요." };
  if (!targetTask) return { error: "이 에이전트가 맡는 업무를 입력해주세요." };
  if (!tasks.length) return { error: "에이전트가 하는 일을 한 개 이상 입력해주세요." };
  if (!effect) return { error: "어떤 효과가 있었는지 입력해주세요." };
  if (!instructions) return { error: "에이전트 정의를 입력해주세요." };

  return {
    data: {
      name,
      description: str(b.desc) || "(설명 없음)",
      category,
      runType,
      trigger: trigger || "수동 실행",
      targetTask,
      tasks,
      tools: strList(b.tools),
      effect,
      timeBefore: parseTimeBand(b.timeBefore),
      timeAfter: parseTimeBand(b.timeAfter),
      prerequisites: strList(b.prerequisites),
      howToUse: strList(b.howToUse),
      instructions,
      linkUrl: str(b.linkUrl) || null,
      outputs: parseOutputs(b.outputs),
    },
  };
}
