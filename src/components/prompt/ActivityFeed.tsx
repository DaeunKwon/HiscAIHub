"use client";

import { useEffect, useState } from "react";
import { HeartFillIcon, CommentIcon, DocIcon, BotIcon } from "@/components/icons";

type NotificationDTO = {
  id: string;
  type: "like" | "comment";
  actor: string;
  ava: string;
  title: string;
  promptId: string | null;
  agentId: string | null;
  text: string | null;
  time: string;
};

type MyLikeDTO = { kind: "prompt" | "agent"; id: string; title: string; author: string; dept: string };

export default function ActivityFeed({
  onOpenPrompt,
  onOpenAgent,
}: {
  onOpenPrompt: (id: string) => void;
  onOpenAgent: (id: string) => void;
}) {
  const [notifications, setNotifications] = useState<NotificationDTO[] | null>(null);
  const [myLikes, setMyLikes] = useState<MyLikeDTO[] | null>(null);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setMyLikes(data.myLikes ?? []);
      });
  }, []);

  if (!notifications || !myLikes) {
    return <p style={{ fontSize: 12.5, color: "var(--text-3)" }}>불러오는 중…</p>;
  }

  function openNotification(n: NotificationDTO) {
    if (n.promptId) onOpenPrompt(n.promptId);
    else if (n.agentId) onOpenAgent(n.agentId);
  }

  return (
    <div className="feed">
      <div className="feed-section">
        <h3>받은 알림</h3>
        {notifications.length === 0 ? (
          <div className="c-empty">아직 받은 알림이 없어요.</div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              className="feed-item"
              onClick={() => openNotification(n)}
              disabled={!n.promptId && !n.agentId}
            >
              <div className="feed-ava">
                {n.ava}
                <span className={`feed-badge ${n.type === "like" ? "like" : "comment"}`}>
                  {n.type === "like" ? <HeartFillIcon size={9} stroke="#fff" fill="#fff" /> : <CommentIcon size={9} stroke="#fff" />}
                </span>
              </div>
              <div className="feed-text">
                <b>{n.actor}</b>님이 회원님의 {n.agentId ? "에이전트" : "프롬프트"} <span className="q">&apos;{n.title}&apos;</span>
                {n.type === "like" ? "을 좋아합니다." : "에 댓글을 남겼습니다."}
                {n.text ? <div style={{ color: "var(--text-2)", marginTop: 3 }}>&quot;{n.text}&quot;</div> : null}
                <div className="feed-time">{n.time}</div>
              </div>
              <div className="feed-thumb">
                {n.agentId ? <BotIcon size={16} /> : <DocIcon size={16} />}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="feed-section">
        <h3>내 좋아요</h3>
        {myLikes.length === 0 ? (
          <div className="c-empty">아직 좋아요한 프롬프트·에이전트가 없어요.</div>
        ) : (
          myLikes.map((l) => (
            <button
              key={`${l.kind}-${l.id}`}
              className="feed-item"
              onClick={() => (l.kind === "prompt" ? onOpenPrompt(l.id) : onOpenAgent(l.id))}
            >
              <div className="feed-ava">
                <span className="feed-badge like">
                  <HeartFillIcon size={9} stroke="#fff" fill="#fff" />
                </span>
              </div>
              <div className="feed-text">
                회원님이 <span className="q">&apos;{l.title}&apos;</span>을 좋아합니다.
                <div className="feed-time">작성자 {l.author} · {l.dept}</div>
              </div>
              <div className="feed-thumb">
                {l.kind === "agent" ? <BotIcon size={16} /> : <DocIcon size={16} />}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
