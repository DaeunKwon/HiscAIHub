"use client";

import { useEffect, useState } from "react";
import { CommentIcon, BotIcon } from "@/components/icons";

type NotificationDTO = {
  id: string;
  type: "review";
  actor: string;
  ava: string;
  title: string;
  agentId: string | null;
  text: string | null;
  time: string;
};

type MyReviewDTO = {
  id: string;
  agentId: string;
  title: string;
  author: string;
  dept: string;
  useCase: string | null;
  time: string;
};

// 좋아요가 사라지면서 "내 좋아요" 자리를 "내가 남긴 후기"가 대신한다.
// 저장 목록은 비공개라 여기 넣지 않는다 — 보드의 저장 탭에서만 본다.
export default function ActivityFeed({ onOpenAgent }: { onOpenAgent: (id: string) => void }) {
  const [notifications, setNotifications] = useState<NotificationDTO[] | null>(null);
  const [myReviews, setMyReviews] = useState<MyReviewDTO[] | null>(null);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setMyReviews(data.myReviews ?? []);
      });
  }, []);

  if (!notifications || !myReviews) {
    return <p style={{ fontSize: 12.5, color: "var(--text-3)" }}>불러오는 중…</p>;
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
              onClick={() => n.agentId && onOpenAgent(n.agentId)}
              disabled={!n.agentId}
            >
              <div className="feed-ava">
                {n.ava}
                <span className="feed-badge comment">
                  <CommentIcon size={9} stroke="#fff" />
                </span>
              </div>
              <div className="feed-text">
                <b>{n.actor}</b>님이 회원님의 에이전트 <span className="q">&apos;{n.title}&apos;</span>에 활용 후기를
                남겼습니다.
                {n.text ? <div style={{ color: "var(--text-2)", marginTop: 3 }}>&quot;{n.text}&quot;</div> : null}
                <div className="feed-time">{n.time}</div>
              </div>
              <div className="feed-thumb">
                <BotIcon size={16} />
              </div>
            </button>
          ))
        )}
      </div>

      <div className="feed-section">
        <h3>내가 남긴 후기</h3>
        {myReviews.length === 0 ? (
          <div className="c-empty">아직 남긴 후기가 없어요. 가져다 쓴 에이전트에 후기를 남겨보세요.</div>
        ) : (
          myReviews.map((r) => (
            <button key={r.id} className="feed-item" onClick={() => onOpenAgent(r.agentId)}>
              <div className="feed-ava">
                <span className="feed-badge comment">
                  <CommentIcon size={9} stroke="#fff" />
                </span>
              </div>
              <div className="feed-text">
                <span className="q">&apos;{r.title}&apos;</span>에 후기를 남겼습니다.
                {r.useCase ? <div style={{ color: "var(--text-2)", marginTop: 3 }}>&quot;{r.useCase}&quot;</div> : null}
                <div className="feed-time">
                  작성자 {r.author} · {r.dept} · {r.time}
                </div>
              </div>
              <div className="feed-thumb">
                <BotIcon size={16} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
