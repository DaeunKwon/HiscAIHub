"use client";

import { useEffect, useState } from "react";
import type { AgentDTO } from "@/lib/agents";
import "@/styles/agent-board.css";
import AgentDetailModal from "./AgentDetailModal";
import AgentFormModal, { type AgentFormData } from "./AgentFormModal";
import { launchClaude } from "@/lib/launch-claude";
import { RUN_ACTION } from "@/lib/categories";
import {
  BotIcon,
  ZapIcon,
  CommentIcon,
  BookmarkIcon,
  BookmarkFillIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";

export type ReviewInput = {
  useCase: string;
  effect: string;
  timeBefore: string;
  timeAfter: string;
};

export default function AgentBoard({
  initialAgents,
  tab,
  search,
  registerOpen,
  setRegisterOpen,
  openAgentId,
  onConsumeOpenAgentId,
}: {
  initialAgents: AgentDTO[];
  tab: string;
  search: string;
  registerOpen: boolean;
  setRegisterOpen: (open: boolean) => void;
  openAgentId?: string | null;
  onConsumeOpenAgentId?: () => void;
}) {
  const [agents, setAgents] = useState(initialAgents);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AgentDTO | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (openAgentId) {
      setDetailId(openAgentId);
      onConsumeOpenAgentId?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAgentId]);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(""), 2200);
  }

  async function toggleSave(id: string) {
    const res = await fetch(`/api/agents/${id}/save`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, saved: data.saved } : a)));
    showToast(data.saved ? "저장했어요" : "저장을 취소했어요");
  }

  // 정의 복사는 실행과 구분해 기록한다 — 실행 카운터는 올리지 않는다.
  async function copyInstructions(a: AgentDTO) {
    try {
      await navigator.clipboard.writeText(a.instructions);
    } catch {}
    fetch(`/api/agents/${a.id}/copy`, { method: "POST" }).catch(() => {});
    showToast("에이전트 정의를 복사했어요");
  }

  // "가져다 쓰기" — 실행 방식에 따라 안내가 다르지만, 어느 쪽이든 실제 실행은 각자 환경에서 이뤄진다.
  // 여기서는 실행 카운터와 감사 로그(부서 확산 지표의 원천)만 남긴다.
  async function runAgent(a: AgentDTO) {
    if (a.runType === "skill" || a.runType === "schedule") {
      await launchClaude(a.instructions);
    } else if (a.linkUrl) {
      window.open(a.linkUrl, "_blank", "noopener");
    }
    const res = await fetch(`/api/agents/${a.id}/run`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setAgents((prev) => prev.map((x) => (x.id === a.id ? { ...x, runs: data.runs } : x)));
    }
    showToast(RUN_ACTION[a.runType].toast);
  }

  async function submitReview(id: string, input: ReviewInput): Promise<string | null> {
    const res = await fetch(`/api/agents/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return data.error ?? "후기 등록에 실패했어요.";
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, reviews: [...a.reviews, data.review] } : a)));
    showToast("활용 후기를 등록했어요. 작성자에게 알림이 갑니다.");
    return null;
  }

  async function deleteAgent(id: string) {
    if (!confirm("이 에이전트를 삭제할까요? 되돌릴 수 없어요.")) return;
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAgents((prev) => prev.filter((a) => a.id !== id));
      if (detailId === id) setDetailId(null);
      showToast("삭제했어요");
    }
  }

  function openEdit(a: AgentDTO) {
    setEditing(a);
    setRegisterOpen(true);
  }

  function closeForm() {
    setRegisterOpen(false);
    setEditing(null);
  }

  async function submitForm(data: AgentFormData): Promise<string | null> {
    const url = editing ? `/api/agents/${editing.id}` : "/api/agents";
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json();
      return e.error ?? (editing ? "저장에 실패했어요." : "등록에 실패했어요.");
    }
    const { agent } = await res.json();
    setAgents((prev) => (editing ? prev.map((a) => (a.id === editing.id ? agent : a)) : [agent, ...prev]));
    closeForm();
    return null;
  }

  // 탭·검색 필터링
  const f = search.trim().toLowerCase();
  let list = agents.slice();
  let mine = false;
  let emptyMsg = "검색 결과가 없어요.";

  if (tab === "popular") {
    // 인기 = 많이 쓰이고 후기가 많이 달린 것. 좋아요를 없앤 자리를 후기 수가 대신한다.
    list = list.slice().sort((a, b) => b.runs + b.reviews.length * 5 - (a.runs + a.reviews.length * 5));
  } else if (tab === "saved") {
    list = list.filter((a) => a.saved);
    if (!f) emptyMsg = "아직 저장한 에이전트가 없어요. 마음에 드는 에이전트를 저장해두면 여기 모여요.";
  } else if (tab === "mine") {
    list = list.filter((a) => a.mine);
    mine = true;
    if (!f) emptyMsg = "아직 만든 에이전트가 없어요. 오른쪽 위 '에이전트 등록'으로 첫 에이전트를 만들어보세요.";
  } else if (!f) {
    emptyMsg = "아직 등록된 에이전트가 없어요.";
  }
  if (f) {
    list = list.filter((a) => (a.name + a.desc + a.cat + a.author).toLowerCase().includes(f));
  }

  const detail = detailId ? agents.find((a) => a.id === detailId) ?? null : null;

  return (
    <>
      {list.length === 0 ? (
        <div className="empty">
          <BotIcon size={30} />
          <br />
          {emptyMsg}
        </div>
      ) : (
        <div className="grid">
          {list.map((a) => (
            <AgentCard
              key={a.id}
              agent={a}
              mine={mine}
              onOpen={() => setDetailId(a.id)}
              onToggleSave={() => toggleSave(a.id)}
              onEdit={() => openEdit(a)}
              onDelete={() => deleteAgent(a.id)}
            />
          ))}
        </div>
      )}

      <AgentDetailModal
        agent={detail}
        onClose={() => setDetailId(null)}
        onToggleSave={toggleSave}
        onCopyInstructions={copyInstructions}
        onReview={submitReview}
        onEdit={(a) => {
          setDetailId(null);
          openEdit(a);
        }}
        onDelete={(id) => deleteAgent(id)}
        onRun={runAgent}
      />

      <AgentFormModal
        open={registerOpen}
        editing={editing}
        onClose={closeForm}
        onSubmit={submitForm}
      />

      <div
        style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--text-1)", color: "#fff", fontSize: 12.5, padding: "10px 16px",
          borderRadius: 20, opacity: toast ? 1 : 0, transition: "opacity .2s", pointerEvents: "none", zIndex: 100,
        }}
      >
        {toast}
      </div>
    </>
  );
}

function AgentCard({
  agent: a,
  mine,
  onOpen,
  onToggleSave,
  onEdit,
  onDelete,
}: {
  agent: AgentDTO;
  mine: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="card" onClick={onOpen}>
      <div className="card-head">
        <span className="cat-badge">{a.cat}</span>
        <div className="card-head-right">
          <button
            className={`card-save ${a.saved ? "on" : ""}`}
            title="저장"
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          >
            {a.saved ? <BookmarkFillIcon size={15} /> : <BookmarkIcon size={15} />}
          </button>
          <span className="card-date">{a.date}</span>
        </div>
      </div>
      <div className="card-title-row">
        <div className="agent-icon"><BotIcon size={16} /></div>
        <div className="card-title">{a.name}</div>
      </div>
      <div className="card-desc">{a.desc}</div>
      <div className="task-chips">
        {a.tasks.slice(0, 2).map((t, i) => (
          <span className="task-chip" key={i}>{t}</span>
        ))}
      </div>
      <div className="card-foot">
        <div className="author">
          <div className="ava">{a.ava}</div>
          <span className="aname">{a.author}</span>
          <span className="dept">{a.dept}</span>
        </div>
        <div className="mini-acts">
          <div className="mini-act"><ZapIcon size={13} /> {a.runs}</div>
          <div className="mini-act"><CommentIcon size={13} /> {a.reviews.length}</div>
        </div>
      </div>
      {mine ? (
        <div className="card-manage">
          <button className="manage-btn" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <EditIcon size={13} /> 수정
          </button>
          <button className="manage-btn del" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <TrashIcon size={13} /> 삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}
