"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AgentDTO, TeamRunRow } from "@/lib/agents";
import { TIME_BANDS, bandLabel } from "@/lib/time-band";
import { RUN_ACTION, runTypeLabel } from "@/lib/categories";
import { launchClaude } from "@/lib/launch-claude";
import { Toast, useToast } from "@/components/Toast";
import {
  ArrowLeftIcon,
  BotIcon,
  BookIcon,
  BookmarkIcon,
  BookmarkFillIcon,
  ClockIcon,
  CopyIcon,
  EditIcon,
  LinkIcon,
  ShareIcon,
  TargetIcon,
  TrashIcon,
  TrendIcon,
  ZapIcon,
  ZapFillIcon,
} from "@/components/icons";

export type ReviewInput = {
  useCase: string;
  effect: string;
  timeBefore: string;
  timeAfter: string;
};

const EMPTY_REVIEW: ReviewInput = { useCase: "", effect: "", timeBefore: "", timeAfter: "" };

export default function AgentDetail({
  agent,
  teamRuns,
}: {
  agent: AgentDTO;
  teamRuns: TeamRunRow[];
}) {
  const router = useRouter();
  const { message, show } = useToast();

  const [a, setAgent] = useState(agent);
  const [defShown, setDefShown] = useState(false);
  const [review, setReview] = useState<ReviewInput>(EMPTY_REVIEW);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const runAction = RUN_ACTION[a.runType];

  async function toggleSave() {
    const res = await fetch(`/api/agents/${a.id}/save`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setAgent((v) => ({ ...v, saved: data.saved }));
    show(data.saved ? "저장했어요" : "저장을 취소했어요");
  }

  // 정의 복사는 실행과 구분해 기록한다 — 실행 카운터는 올리지 않는다.
  async function copyInstructions() {
    try {
      await navigator.clipboard.writeText(a.instructions);
    } catch {}
    fetch(`/api/agents/${a.id}/copy`, { method: "POST" }).catch(() => {});
    show("에이전트 정의를 복사했어요");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      show("링크를 복사했어요");
    } catch {
      show("링크 복사에 실패했어요");
    }
  }

  // "가져다 쓰기" — 실행 방식에 따라 안내가 다르지만 실제 실행은 각자 환경에서 이뤄진다.
  // 여기서는 실행 카운터와 감사 로그(부서 확산 지표의 원천)만 남긴다.
  async function runAgent() {
    if (a.runType === "skill" || a.runType === "schedule") {
      await launchClaude(a.instructions);
    } else if (a.linkUrl) {
      window.open(a.linkUrl, "_blank", "noopener");
    }
    const res = await fetch(`/api/agents/${a.id}/run`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setAgent((v) => ({ ...v, runs: data.runs }));
    }
    show(runAction.toast);
  }

  async function submitReview() {
    if (!review.effect.trim()) {
      setError("어떤 효과가 있었는지 입력해주세요.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/agents/${a.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(review),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "후기 등록에 실패했어요.");
      return;
    }
    setAgent((v) => ({ ...v, reviews: [...v.reviews, data.review] }));
    setReview(EMPTY_REVIEW);
    setError(null);
    show("활용 후기를 등록했어요. 작성자에게 알림이 갑니다.");
  }

  async function deleteAgent() {
    if (!confirm("이 에이전트를 삭제할까요? 되돌릴 수 없어요.")) return;
    const res = await fetch(`/api/agents/${a.id}`, { method: "DELETE" });
    if (!res.ok) return;
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="page">
        <div className="page-head">
          <button className="back-btn" onClick={() => router.push("/")}>
            <ArrowLeftIcon size={15} /> 목록으로
          </button>
          <span className="crumb">/agents/{a.id}</span>
        </div>

        <div className="page-card">
          <span className="modal-cat">{a.cat}</span>
          <div className="modal-icon-row">
            <div className="agent-icon">
              <BotIcon size={20} />
            </div>
            <div className="modal-title">{a.name}</div>
          </div>
          <div className="modal-desc">{a.desc}</div>

          <div className="sec">
            <div className="sec-label">
              <TargetIcon size={13} />이 에이전트가 맡는 업무
            </div>
            <div className="sec-body">{a.targetTask}</div>
          </div>

          <div className="sec">
            <div className="sec-label">
              <BotIcon size={13} />
              에이전트가 스스로 하는 일
            </div>
            <ol className="step-flow">
              {a.tasks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </div>

          {a.tools.length > 0 && (
            <div className="sec">
              <div className="sec-label">
                <LinkIcon size={13} />
                연결되는 도구 · 데이터
              </div>
              <div className="tool-chips">
                {a.tools.map((t, i) => (
                  <span className="tool-chip" key={i}>
                    {t}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 9, lineHeight: 1.6 }}>
                이 에이전트가 실제로 접근하는 대상이에요. 권한이 필요한 항목은 아래 「미리 준비할
                것」에 적혀 있습니다.
              </div>
            </div>
          )}

          <div className="sec">
            <div className="sec-label">
              <TrendIcon size={13} />
              효과
            </div>
            <div className="sec-body">{a.effect}</div>
            {a.timeBefore && a.timeAfter && (
              <div className="effect-box">
                <div className="time-pair">
                  <span className="before">{bandLabel(a.timeBefore)}</span> →
                  <span className="after">{bandLabel(a.timeAfter)}</span>
                </div>
                {a.savedPct !== null && (
                  <span className="time-saved">약 {a.savedPct}% 단축</span>
                )}
              </div>
            )}
          </div>

          <HowTo agent={a} defShown={defShown} onToggleDef={() => setDefShown((v) => !v)} />

          <div className="author-row">
            <div className="ava">{a.ava}</div>
            <span className="aname">{a.author}</span>
            <span className="dept">{a.dept}</span>
            {a.mine && <span className="mine-tag">내 글</span>}
            <span className="date">{a.date}</span>
          </div>

          <div className="stat-strip">
            <span>
              <ZapIcon size={13} /> 실행 <b>{a.runs}</b>
            </span>
            <span>
              실행한 팀 <b>{teamRuns.length}곳</b>
            </span>
            <span>
              활용 후기 <b>{a.reviews.length}</b>
            </span>
          </div>

          {teamRuns.length > 0 && (
            <div className="team-chips">
              {teamRuns.map((t) => (
                <span className={`team-chip${t.owner ? " owner" : ""}`} key={t.team}>
                  {t.team} <b>{t.runs}회</b>
                  {t.owner ? " · 등록 팀" : ""}
                </span>
              ))}
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  marginTop: 8,
                  lineHeight: 1.6,
                  width: "100%",
                }}
              >
                최근 30일 동안 「가져다 쓰기」를 누른 팀이에요.
              </div>
            </div>
          )}

          <hr className="divider" />

          <div className="actions">
            <button className="act-btn run" onClick={runAgent}>
              <ZapFillIcon size={14} /> {runAction.label}
            </button>
            <button className={`act-btn ${a.saved ? "saved" : ""}`} onClick={toggleSave}>
              {a.saved ? <BookmarkFillIcon size={14} /> : <BookmarkIcon size={14} />}{" "}
              {a.saved ? "저장됨" : "저장"}
            </button>
            <button className="act-btn" onClick={copyInstructions}>
              <CopyIcon size={14} /> 정의 복사
            </button>
            <button className="act-btn" onClick={copyLink}>
              <ShareIcon size={14} /> 공유
            </button>
            {a.mine && (
              <>
                <button className="act-btn" onClick={() => router.push(`/agents/${a.id}/edit`)}>
                  <EditIcon size={14} /> 수정
                </button>
                <button className="act-btn del" onClick={deleteAgent}>
                  <TrashIcon size={14} /> 삭제
                </button>
              </>
            )}
          </div>

          <div className="reviews-label">
            활용 후기 <span>{a.reviews.length}</span>
          </div>
          <div className="reviews-sub">이 에이전트를 실제로 써본 임직원들이 남긴 기록이에요.</div>

          {a.reviews.length === 0 ? (
            <div className="c-empty">아직 후기가 없어요. 첫 후기를 남겨보세요.</div>
          ) : (
            a.reviews.map((r) => (
              <div className="review-card" key={r.id}>
                <div className="review-head">
                  <div className="ava">{r.ava}</div>
                  <span className="r-name">{r.name}</span>
                  <span className="dept">{r.dept}</span>
                  <span className="r-date">{r.date}</span>
                </div>
                {r.useCase && (
                  <div className="r-usecase">
                    <TargetIcon size={12} /> {r.useCase}
                  </div>
                )}
                <div className="r-effect">{r.effect}</div>
                {r.timeBefore && r.timeAfter && (
                  <div className="r-time">
                    <ClockIcon size={12} />
                    {bandLabel(r.timeBefore)} → {bandLabel(r.timeAfter)}
                    {r.savedPct !== null ? ` · 약 ${r.savedPct}% 단축` : ""}
                  </div>
                )}
              </div>
            ))
          )}

          <div className="review-form">
            <div className="rf-title">나도 써봤어요</div>
            <div className="rf-sub">
              이 에이전트를 어떤 업무에 썼고 어떤 효과가 있었는지 남겨주세요. 남겨주신 시간 구간은
              전사 절감 시간 집계에 반영됩니다.
            </div>
            <div className="field">
              <label>어떤 업무에 쓰셨나요?</label>
              <input
                type="text"
                value={review.useCase}
                onChange={(e) => setReview((v) => ({ ...v, useCase: e.target.value }))}
                placeholder="예) 2분기 실적 리포트 30건 사전 검토"
              />
            </div>
            <div className="field">
              <label>
                어떤 효과가 있었나요?<span className="req">*</span>
              </label>
              <textarea
                rows={3}
                value={review.effect}
                onChange={(e) => setReview((v) => ({ ...v, effect: e.target.value }))}
                placeholder="시간이 얼마나 줄었는지, 품질이 어떻게 달라졌는지 편하게 적어주세요."
              />
            </div>
            <div className="time-row">
              <div className="field">
                <label>기존 소요시간</label>
                <select
                  value={review.timeBefore}
                  onChange={(e) => setReview((v) => ({ ...v, timeBefore: e.target.value }))}
                >
                  <option value="">선택 안 함</option>
                  {TIME_BANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sep">→</div>
              <div className="field">
                <label>단축 후 소요시간</label>
                <select
                  value={review.timeAfter}
                  onChange={(e) => setReview((v) => ({ ...v, timeAfter: e.target.value }))}
                >
                  <option value="">선택 안 함</option>
                  {TIME_BANDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div style={{ textAlign: "right", marginTop: 14 }}>
              <button className="btn-primary" onClick={submitReview} disabled={submitting}>
                {submitting ? "등록 중…" : "후기 등록"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Toast message={message} />
    </>
  );
}

function HowTo({
  agent: a,
  defShown,
  onToggleDef,
}: {
  agent: AgentDTO;
  defShown: boolean;
  onToggleDef: () => void;
}) {
  return (
    <div className="sec">
      <div className="sec-label">
        <BookIcon size={13} />
        가져다 쓰는 방법
      </div>
      <div className="howto">
        <div className="run-badge">
          <ZapIcon size={12} />
          {runTypeLabel(a.runType)}
        </div>
        <div className="trigger-line">
          <ClockIcon size={13} />
          언제 실행되나요 — <b>{a.trigger}</b>
        </div>

        {a.prerequisites.length > 0 && (
          <>
            <div className="howto-sub">미리 준비할 것</div>
            <ul className="prep-list">
              {a.prerequisites.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </>
        )}

        <div className="howto-sub">사용 순서</div>
        <ol className="step-list">
          {a.howToUse.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ol>

        {a.linkUrl && (
          <>
            <div className="howto-sub">바로가기</div>
            <a className="ext-link" href={a.linkUrl} target="_blank" rel="noopener noreferrer">
              <LinkIcon size={13} />
              {a.linkUrl}
            </a>
            <div style={{ height: 18 }} />
          </>
        )}

        <div className="howto-sub">에이전트 정의 (역할 · 도구 · 작업 절차)</div>
        {defShown && <div className="modal-code">{a.instructions}</div>}
        <button className="link-toggle" onClick={onToggleDef}>
          <CopyIcon size={13} /> {defShown ? "정의 닫기" : "정의 보기"}
        </button>
      </div>
    </div>
  );
}
