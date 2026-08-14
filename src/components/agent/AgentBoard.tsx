"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AgentDTO } from "@/lib/agents";
import { Toast, useToast } from "@/components/Toast";
import "@/styles/agent-board.css";
import {
  BotIcon,
  ZapIcon,
  CommentIcon,
  BookmarkIcon,
  BookmarkFillIcon,
  EditIcon,
  TrashIcon,
} from "@/components/icons";

export default function AgentBoard({
  initialAgents,
  tab,
  search,
}: {
  initialAgents: AgentDTO[];
  tab: string;
  search: string;
}) {
  const router = useRouter();
  const { message, show } = useToast();
  const [agents, setAgents] = useState(initialAgents);

  async function toggleSave(id: string) {
    const res = await fetch(`/api/agents/${id}/save`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, saved: data.saved } : a)));
    show(data.saved ? "저장했어요" : "저장을 취소했어요");
  }

  async function deleteAgent(id: string) {
    if (!confirm("이 에이전트를 삭제할까요? 되돌릴 수 없어요.")) return;
    const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAgents((prev) => prev.filter((a) => a.id !== id));
      show("삭제했어요");
    }
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
              onToggleSave={() => toggleSave(a.id)}
              onEdit={() => router.push(`/agents/${a.id}/edit`)}
              onDelete={() => deleteAgent(a.id)}
            />
          ))}
        </div>
      )}

      <Toast message={message} />
    </>
  );
}

function AgentCard({
  agent: a,
  mine,
  onToggleSave,
  onEdit,
  onDelete,
}: {
  agent: AgentDTO;
  mine: boolean;
  onToggleSave: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  // 카드 전체가 상세 페이지 링크다. 저장·수정·삭제 버튼은 이동을 막고 자기 동작만 한다.
  const stop = (e: React.MouseEvent, fn: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    fn();
  };

  return (
    <Link href={`/agents/${a.id}`} className="card">
      <div className="card-head">
        <span className="cat-badge">{a.cat}</span>
        <div className="card-head-right">
          <button
            className={`card-save ${a.saved ? "on" : ""}`}
            title="저장"
            onClick={(e) => stop(e, onToggleSave)}
          >
            {a.saved ? <BookmarkFillIcon size={15} /> : <BookmarkIcon size={15} />}
          </button>
          <span className="card-date">{a.date}</span>
        </div>
      </div>
      <div className="card-title-row">
        <div className="agent-icon">
          <BotIcon size={16} />
        </div>
        <div className="card-title">{a.name}</div>
      </div>
      <div className="card-desc">{a.desc}</div>
      <div className="task-chips">
        {a.tasks.slice(0, 2).map((t, i) => (
          <span className="task-chip" key={i}>
            {t}
          </span>
        ))}
      </div>
      <div className="card-foot">
        <div className="author">
          <div className="ava">{a.ava}</div>
          <span className="aname">{a.author}</span>
          <span className="dept">{a.dept}</span>
        </div>
        <div className="mini-acts">
          <div className="mini-act">
            <ZapIcon size={13} /> {a.runs}
          </div>
          <div className="mini-act">
            <CommentIcon size={13} /> {a.reviews.length}
          </div>
        </div>
      </div>
      {mine ? (
        <div className="card-manage">
          <button className="manage-btn" onClick={(e) => stop(e, onEdit)}>
            <EditIcon size={13} /> 수정
          </button>
          <button className="manage-btn del" onClick={(e) => stop(e, onDelete)}>
            <TrashIcon size={13} /> 삭제
          </button>
        </div>
      ) : null}
    </Link>
  );
}
