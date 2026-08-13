"use client";

import { useState } from "react";
import {
  BulbIcon,
  BotIcon,
  SearchIcon,
  SparklesIcon,
  PlusIcon,
  GridIcon,
  TrophyIcon,
  BookmarkIcon,
} from "@/components/icons";
import { logout } from "@/app/actions/auth";
import ActivityFeed from "@/components/ActivityFeed";
import AgentBoard from "@/components/agent/AgentBoard";
import type { AgentDTO } from "@/lib/agents";

export type ShellUser = { name: string; dept: string; email: string };

type Tab = { id: string; label: string; icon: React.ReactNode };

// 프롬프트/에이전트 모드 전환은 기획서 개정으로 제거 — 에이전트 단일 체계.
// 대시보드 탭은 4단계에서 이 목록 맨 앞에 붙는다.
const TABS: Tab[] = [
  { id: "home", label: "전체", icon: <GridIcon size={15} /> },
  { id: "popular", label: "인기", icon: <TrophyIcon size={15} /> },
  { id: "saved", label: "저장", icon: <BookmarkIcon size={15} /> },
  { id: "mine", label: "내 에이전트", icon: <BotIcon size={15} /> },
];

const HEADERS: Record<string, { h: string; p: string }> = {
  home: {
    h: "에이전트",
    p: "임직원이 만들어 공유한 에이전트예요. 어떤 업무에 어떻게 썼고 무슨 효과가 있었는지까지 함께 볼 수 있어요.",
  },
  popular: { h: "인기 에이전트", p: "이번 달 가장 많이 쓰이고 후기가 많이 달린 에이전트예요." },
  saved: { h: "저장한 에이전트", p: "저장 버튼을 누른 에이전트만 모여요. 저장 내역은 나만 볼 수 있어요." },
  mine: { h: "내 에이전트", p: "내가 만든 에이전트예요. 수정하거나 삭제할 수 있어요." },
  activity: { h: "활동", p: "받은 알림과 내가 남긴 활용 후기를 모아봤어요." },
};

export default function AppShell({
  user,
  initialAgents,
}: {
  user: ShellUser;
  initialAgents: AgentDTO[];
}) {
  const [tab, setTab] = useState("home");
  const [search, setSearch] = useState("");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [openAgentId, setOpenAgentId] = useState<string | null>(null);

  const displayName = user.name || "임직원";
  const initial = displayName.charAt(0) || "H";
  const isActivity = tab === "activity";
  const header = HEADERS[tab];

  return (
    <>
      {/* 상단바 */}
      <div className="topbar">
        <div className="logo">
          <div className="logo-sq">
            <BulbIcon size={13} stroke="#fff" />
          </div>
          AI 공유 허브 <span className="logo-sub">· 한화투자증권</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="user-pill" onClick={() => setTab("activity")}>
            <span className="dot">{initial}</span> {displayName} · {user.dept}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="tnav"
              style={{ fontSize: 12, color: "var(--text-3)" }}
            >
              로그아웃
            </button>
          </form>
        </div>
      </div>

      {/* 서브바 */}
      <div className="subbar">
        <div className="subtabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tnav ${t.id === tab ? "on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="subbar-right">
          <div className="search-wrap">
            <SearchIcon size={15} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="에이전트 검색..."
            />
          </div>
          <div className="subbar-actions">
            <button className="make-btn" onClick={() => setCreateOpen(true)}>
              <SparklesIcon size={15} /> 에이전트 만들기
            </button>
            <button className="reg-btn" onClick={() => setRegisterOpen(true)}>
              <PlusIcon size={15} /> 에이전트 등록
            </button>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="content">
        <div className="view-header">
          <h2>{header.h}</h2>
          <p>{header.p}</p>
        </div>

        {isActivity ? (
          <ActivityFeed
            onOpenAgent={(id) => {
              setTab("home");
              setOpenAgentId(id);
            }}
          />
        ) : (
          <AgentBoard
            initialAgents={initialAgents}
            tab={tab}
            search={search}
            registerOpen={registerOpen}
            setRegisterOpen={setRegisterOpen}
            createOpen={createOpen}
            setCreateOpen={setCreateOpen}
            openAgentId={openAgentId}
            onConsumeOpenAgentId={() => setOpenAgentId(null)}
          />
        )}
      </div>
    </>
  );
}
