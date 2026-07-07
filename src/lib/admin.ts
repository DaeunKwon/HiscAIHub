// 관리자 콘솔 데이터 계층 — DB ↔ 관리자 콘솔 DTO 변환.
import { db } from "./db";

function fmtDateTime(d: Date): string {
  const dt = `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  const tm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${dt} ${tm}`;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ---------- 대시보드 ----------
export async function getDashboardStats() {
  const weekAgo = daysAgo(7);
  const prevWeekAgo = daysAgo(14);

  const [activeUsersThisWeek, activeUsersPrevWeek, newPrompts, newAgents, callsThisWeek, callsPrevWeek, costAgg] =
    await Promise.all([
      db.usageLog.findMany({ where: { createdAt: { gte: weekAgo } }, distinct: ["userId"], select: { userId: true } }),
      db.usageLog.findMany({ where: { createdAt: { gte: prevWeekAgo, lt: weekAgo } }, distinct: ["userId"], select: { userId: true } }),
      db.prompt.count({ where: { createdAt: { gte: weekAgo } } }),
      db.agent.count({ where: { createdAt: { gte: weekAgo } } }),
      db.usageLog.count({ where: { createdAt: { gte: weekAgo } } }),
      db.usageLog.count({ where: { createdAt: { gte: prevWeekAgo, lt: weekAgo } } }),
      db.usageLog.aggregate({ where: { createdAt: { gte: weekAgo } }, _sum: { costUsd: true } }),
    ]);

  const pendingReports = await db.report.findMany({
    where: { status: "pending" },
    include: { prompt: true, agent: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  const topPrompts = await db.prompt.findMany({ orderBy: { runCount: "desc" }, take: 5, select: { id: true, title: true, runCount: true } });
  const topAgents = await db.agent.findMany({ orderBy: { runCount: "desc" }, take: 5, select: { id: true, name: true, runCount: true } });
  const topContent = [
    ...topPrompts.map((p) => ({ type: "프롬프트" as const, title: p.title, runs: p.runCount })),
    ...topAgents.map((a) => ({ type: "에이전트" as const, title: a.name, runs: a.runCount })),
  ]
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5);

  const activeUsersDelta = activeUsersPrevWeek.length
    ? Math.round(((activeUsersThisWeek.length - activeUsersPrevWeek.length) / activeUsersPrevWeek.length) * 100)
    : null;
  const callsDelta = callsPrevWeek ? Math.round(((callsThisWeek - callsPrevWeek) / callsPrevWeek) * 100) : null;

  return {
    activeUsers: activeUsersThisWeek.length,
    activeUsersDelta,
    newContent: { prompts: newPrompts, agents: newAgents, total: newPrompts + newAgents },
    callsThisWeek,
    callsDelta,
    costThisWeekUsd: costAgg._sum.costUsd ?? 0,
    pendingReports: pendingReports.map((r) => ({
      id: r.id,
      type: r.promptId ? ("프롬프트" as const) : ("에이전트" as const),
      title: r.prompt?.title ?? r.agent?.name ?? "",
      reason: r.reason,
    })),
    pendingReportCount: await db.report.count({ where: { status: "pending" } }),
    topContent,
  };
}

// ---------- 콘텐츠 관리 ----------
export type ContentRow = {
  id: string;
  type: "프롬프트" | "에이전트";
  title: string;
  author: string;
  dept: string;
  metric: string;
  status: "pub" | "hidden" | "flag";
  official: boolean;
};

const STATUS_MAP = { published: "pub", hidden: "hidden", flagged: "flag" } as const;

export async function listContent(): Promise<ContentRow[]> {
  const [prompts, agents] = await Promise.all([
    db.prompt.findMany({ include: { author: true, _count: { select: { likes: true } } }, orderBy: { createdAt: "desc" } }),
    db.agent.findMany({ include: { author: true, _count: { select: { likes: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  const promptRows: ContentRow[] = prompts.map((p) => ({
    id: p.id,
    type: "프롬프트",
    title: p.title,
    author: p.author.name,
    dept: p.author.dept,
    metric: `실행 ${p.runCount} · ♥ ${p.likeCount}`,
    status: STATUS_MAP[p.status],
    official: p.official,
  }));
  const agentRows: ContentRow[] = agents.map((a) => ({
    id: a.id,
    type: "에이전트",
    title: a.name,
    author: a.author.name,
    dept: a.author.dept,
    metric: `실행 ${a.runCount} · ♥ ${a.likeCount}`,
    status: STATUS_MAP[a.status],
    official: a.official,
  }));
  return [...promptRows, ...agentRows].sort((a, b) => (a.title < b.title ? -1 : 1));
}

export async function toggleContentOfficial(type: "prompt" | "agent", id: string): Promise<boolean> {
  if (type === "prompt") {
    const p = await db.prompt.findUniqueOrThrow({ where: { id } });
    const updated = await db.prompt.update({ where: { id }, data: { official: !p.official } });
    return updated.official;
  }
  const a = await db.agent.findUniqueOrThrow({ where: { id } });
  const updated = await db.agent.update({ where: { id }, data: { official: !a.official } });
  return updated.official;
}

export async function toggleContentHidden(type: "prompt" | "agent", id: string): Promise<"pub" | "hidden"> {
  if (type === "prompt") {
    const p = await db.prompt.findUniqueOrThrow({ where: { id } });
    const next = p.status === "hidden" ? "published" : "hidden";
    await db.prompt.update({ where: { id }, data: { status: next } });
    return STATUS_MAP[next] as "pub" | "hidden";
  }
  const a = await db.agent.findUniqueOrThrow({ where: { id } });
  const next = a.status === "hidden" ? "published" : "hidden";
  await db.agent.update({ where: { id }, data: { status: next } });
  return STATUS_MAP[next] as "pub" | "hidden";
}

export async function deleteContent(type: "prompt" | "agent", id: string): Promise<void> {
  if (type === "prompt") await db.prompt.delete({ where: { id } });
  else await db.agent.delete({ where: { id } });
}

// ---------- 신고 처리 ----------
export async function listPendingReports() {
  const reports = await db.report.findMany({
    where: { status: "pending" },
    include: { prompt: true, agent: true },
    orderBy: { createdAt: "asc" },
  });
  return reports.map((r) => ({
    id: r.id,
    type: r.promptId ? ("프롬프트" as const) : ("에이전트" as const),
    contentType: r.promptId ? ("prompt" as const) : ("agent" as const),
    contentId: (r.promptId ?? r.agentId) as string,
    title: r.prompt?.title ?? r.agent?.name ?? "(삭제된 콘텐츠)",
    reason: r.reason,
    reporterCount: 1,
    date: fmtDateTime(r.createdAt),
  }));
}

export async function resolveReport(reportId: string, action: "keep" | "hide" | "delete"): Promise<void> {
  const report = await db.report.findUniqueOrThrow({ where: { id: reportId } });

  if (action === "delete") {
    if (report.promptId) await db.prompt.delete({ where: { id: report.promptId } });
    else if (report.agentId) await db.agent.delete({ where: { id: report.agentId } });
    // Report는 콘텐츠 삭제 시 cascade로 함께 삭제됨
    return;
  }

  if (action === "hide") {
    if (report.promptId) await db.prompt.update({ where: { id: report.promptId }, data: { status: "hidden" } });
    else if (report.agentId) await db.agent.update({ where: { id: report.agentId }, data: { status: "hidden" } });
  }

  await db.report.update({ where: { id: reportId }, data: { status: "resolved", action, resolvedAt: new Date() } });
}

// ---------- 사용자·권한 ----------
export async function listUsersAdmin() {
  const users = await db.user.findMany({
    include: { _count: { select: { prompts: true, agents: true } } },
    orderBy: { createdAt: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    dept: u.dept,
    email: u.email,
    posts: u._count.prompts + u._count.agents,
    last: u.lastActiveAt ? fmtDateTime(u.lastActiveAt) : "-",
    role: u.role,
  }));
}

export async function updateUserRole(userId: string, role: "admin" | "mod" | "user"): Promise<string> {
  const updated = await db.user.update({ where: { id: userId }, data: { role } });
  return updated.name;
}

// ---------- 사용량·비용 ----------
export async function getUsageStats() {
  const since = daysAgo(6);
  since.setHours(0, 0, 0, 0);

  const logs = await db.usageLog.findMany({
    where: { createdAt: { gte: since } },
    include: { user: true },
  });

  const byDay = new Map<string, { count: number; cost: number }>();
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay.set(d.toDateString(), { count: 0, cost: 0 });
  }
  for (const log of logs) {
    const key = log.createdAt.toDateString();
    const entry = byDay.get(key);
    if (entry) {
      entry.count += 1;
      entry.cost += log.costUsd;
    }
  }
  const daily = Array.from(byDay.entries()).map(([dateStr, v]) => ({
    label: dayLabels[new Date(dateStr).getDay()],
    count: v.count,
    cost: Math.round(v.cost * 100) / 100,
  }));

  const byFeature = new Map<string, { count: number; cost: number }>();
  for (const log of logs) {
    const entry = byFeature.get(log.feature) ?? { count: 0, cost: 0 };
    entry.count += 1;
    entry.cost += log.costUsd;
    byFeature.set(log.feature, entry);
  }
  const FEATURE_LABEL: Record<string, string> = {
    prompt_generate: "프롬프트 만들기",
    agent_generate: "에이전트 만들기",
    agent_run: "에이전트 실행",
  };
  const featureBreakdown = Array.from(byFeature.entries()).map(([feature, v]) => ({
    feature,
    label: FEATURE_LABEL[feature] ?? feature,
    count: v.count,
    cost: Math.round(v.cost * 100) / 100,
  }));

  const byUser = new Map<string, { name: string; dept: string; count: number }>();
  for (const log of logs) {
    const entry = byUser.get(log.userId) ?? { name: log.user.name, dept: log.user.dept, count: 0 };
    entry.count += 1;
    byUser.set(log.userId, entry);
  }
  const topUsers = Array.from(byUser.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const totalCalls = logs.length;
  const totalCost = Math.round(logs.reduce((sum, l) => sum + l.costUsd, 0) * 100) / 100;

  const setting = await db.setting.findUnique({ where: { key: "per_user_daily_call_limit" } });
  const perUserLimit = typeof setting?.value === "number" ? setting.value : 100;

  return { daily, featureBreakdown, topUsers, totalCalls, totalCost, perUserLimit };
}

export async function setPerUserDailyLimit(limit: number): Promise<void> {
  await db.setting.upsert({
    where: { key: "per_user_daily_call_limit" },
    update: { value: limit },
    create: { key: "per_user_daily_call_limit", value: limit },
  });
}

// ---------- 감사 로그 ----------
const AUDIT_ACTION_LABEL: Record<string, string> = {
  prompt_generate: "프롬프트 만들기",
  prompt_create: "프롬프트 등록",
  prompt_update: "프롬프트 수정",
  prompt_delete: "프롬프트 삭제",
  prompt_run: "프롬프트 실행",
  prompt_copy: "프롬프트 복사",
  agent_generate: "에이전트 만들기",
  agent_create: "에이전트 등록",
  agent_update: "에이전트 수정",
  agent_delete: "에이전트 삭제",
  agent_run: "에이전트 실행",
};

export async function listAuditLogs(filters: { action?: string; days?: number }) {
  const where: Record<string, unknown> = {};
  if (filters.action) where.action = filters.action;
  if (filters.days) where.createdAt = { gte: daysAgo(filters.days) };

  const logs = await db.auditLog.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return logs.map((l) => ({
    id: l.id,
    time: fmtDateTime(l.createdAt),
    user: l.user.name,
    action: AUDIT_ACTION_LABEL[l.action] ?? l.action,
    target: l.targetLabel ?? "—",
    files: l.fileCount > 0 ? `${l.fileCount}개` : "—",
    status: l.status === "success" ? "성공" : "실패",
  }));
}

// ---------- 설정 ----------
export async function listCategoriesAdmin() {
  return db.category.findMany({ orderBy: { order: "asc" } });
}

export async function addCategoryAdmin(name: string): Promise<void> {
  const count = await db.category.count();
  await db.category.create({ data: { name, order: count } });
}

export async function removeCategoryAdmin(id: string): Promise<void> {
  await db.category.delete({ where: { id } });
}

export async function getSettingsAdmin() {
  const [keywords, warning, globalLimit] = await Promise.all([
    db.setting.findUnique({ where: { key: "sensitive_keywords" } }),
    db.setting.findUnique({ where: { key: "registration_warning" } }),
    db.setting.findUnique({ where: { key: "global_daily_call_limit" } }),
  ]);
  return {
    sensitiveKeywords: Array.isArray(keywords?.value) ? (keywords!.value as string[]) : [],
    registrationWarning: typeof warning?.value === "string" ? warning.value : "",
    globalDailyCallLimit: typeof globalLimit?.value === "number" ? globalLimit.value : 5000,
  };
}

export async function updateSensitiveKeywords(keywords: string[]): Promise<void> {
  await db.setting.upsert({
    where: { key: "sensitive_keywords" },
    update: { value: keywords },
    create: { key: "sensitive_keywords", value: keywords },
  });
}

export async function saveSettingsAdmin(data: { registrationWarning: string; globalDailyCallLimit: number }): Promise<void> {
  await db.$transaction([
    db.setting.upsert({
      where: { key: "registration_warning" },
      update: { value: data.registrationWarning },
      create: { key: "registration_warning", value: data.registrationWarning },
    }),
    db.setting.upsert({
      where: { key: "global_daily_call_limit" },
      update: { value: data.globalDailyCallLimit },
      create: { key: "global_daily_call_limit", value: data.globalDailyCallLimit },
    }),
  ]);
}
