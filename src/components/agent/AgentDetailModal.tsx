"use client";

import { useEffect, useState } from "react";
import type { AgentDTO } from "@/lib/agents";
import type { ReviewInput } from "./AgentBoard";
import { TIME_BANDS, bandLabel } from "@/lib/time-band";
import { RUN_ACTION, runTypeLabel } from "@/lib/categories";
import {
  XIcon,
  BotIcon,
  DocIcon,
  BookmarkIcon,
  BookmarkFillIcon,
  CopyIcon,
  ShareIcon,
  EditIcon,
  TrashIcon,
  ZapIcon,
  ZapFillIcon,
} from "@/components/icons";

const EMPTY_REVIEW: ReviewInput = { useCase: "", effect: "", timeBefore: "", timeAfter: "" };

export default function AgentDetailModal({
  agent,
  onClose,
  onToggleSave,
  onCopyInstructions,
  onReview,
  onEdit,
  onDelete,
  onRun,
}: {
  agent: AgentDTO | null;
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onCopyInstructions: (a: AgentDTO) => void;
  onReview: (id: string, input: ReviewInput) => Promise<string | null>;
  onEdit: (a: AgentDTO) => void;
  onDelete: (id: string) => void;
  onRun: (a: AgentDTO) => void;
}) {
  const [instShown, setInstShown] = useState(false);
  const [review, setReview] = useState<ReviewInput>(EMPTY_REVIEW);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setInstShown(false);
    setReview(EMPTY_REVIEW);
    setError(null);
  }, [agent?.id]);

  if (!agent) return null;
  const a = agent;

  async function submitReview() {
    if (!review.effect.trim()) {
      setError("어떤 효과가 있었는지 입력해주세요.");
      return;
    }
    setSubmitting(true);
    const err = await onReview(a.id, review);
    setSubmitting(false);
    setError(err);
    if (!err) setReview(EMPTY_REVIEW);
  }

  const runAction = RUN_ACTION[a.runType];

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <XIcon size={18} />
        </button>

        <span className="modal-cat">{a.cat}</span>
        <div className="modal-icon-row">
          <div className="agent-icon"><BotIcon size={20} /></div>
          <div className="modal-title">{a.name}</div>
        </div>
        <div className="modal-desc">{a.desc}</div>

        <div className="prompt-label">실행 방식</div>
        <div className="task-chips">
          <span className="task-chip">{runTypeLabel(a.runType)}</span>
          <span className="task-chip">{a.trigger}</span>
        </div>

        <div className="prompt-label">이 에이전트가 맡는 업무</div>
        <div className="sec-body">{a.targetTask}</div>

        <div className="prompt-label">에이전트가 스스로 하는 일</div>
        <ol className="step-flow">
          {a.tasks.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>

        {a.tools.length ? (
          <>
            <div className="prompt-label">연결되는 도구 · 데이터</div>
            <div className="task-chips">
              {a.tools.map((t, i) => (
                <span className="task-chip" key={i}>{t}</span>
              ))}
            </div>
          </>
        ) : null}

        <div className="prompt-label">효과</div>
        <div className="sec-body">{a.effect}</div>
        {a.timeBefore && a.timeAfter ? (
          <div className="effect-box">
            <div className="time-pair">
              <span className="before">{bandLabel(a.timeBefore)}</span> →{" "}
              <span className="after">{bandLabel(a.timeAfter)}</span>
            </div>
            {a.savedPct !== null ? <span className="time-saved">약 {a.savedPct}% 단축</span> : null}
          </div>
        ) : null}

        {a.prerequisites.length ? (
          <>
            <div className="prompt-label">미리 준비할 것</div>
            <ul className="step-flow">
              {a.prerequisites.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </>
        ) : null}

        {a.howToUse.length ? (
          <>
            <div className="prompt-label">사용 순서</div>
            <ol className="step-flow">
              {a.howToUse.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
          </>
        ) : null}

        <button className="link-toggle" onClick={() => setInstShown((v) => !v)}>
          <DocIcon size={13} /> {instShown ? "정의 닫기" : "에이전트 정의 보기"}
        </button>
        {instShown ? <div className="modal-prompt">{a.instructions}</div> : null}

        <div className="author-row">
          <div className="ava">{a.ava}</div>
          <span className="aname">{a.author}</span>
          <span className="dept">{a.dept}</span>
          {a.mine ? <span className="mine-tag">내 글</span> : null}
          <span className="date">{a.date}</span>
        </div>

        <div className="stat-strip">
          <span><ZapIcon size={13} /> 실행 <b>{a.runs}</b></span>
          <span>활용 후기 <b>{a.reviews.length}</b></span>
        </div>
        <hr className="divider" />

        <div className="actions">
          <button className="act-btn run" onClick={() => onRun(a)}>
            <ZapFillIcon size={14} /> {runAction.label}
          </button>
          <button className={`act-btn ${a.saved ? "saved" : ""}`} onClick={() => onToggleSave(a.id)}>
            {a.saved ? <BookmarkFillIcon size={14} /> : <BookmarkIcon size={14} />} {a.saved ? "저장됨" : "저장"}
          </button>
          <button className="act-btn" onClick={() => onCopyInstructions(a)}>
            <CopyIcon size={14} /> 정의 복사
          </button>
          <button className="act-btn" onClick={() => alert("공유 링크가 복사됐어요")}>
            <ShareIcon size={14} /> 공유
          </button>
          {a.mine ? (
            <>
              <button className="act-btn" onClick={() => onEdit(a)}>
                <EditIcon size={14} /> 수정
              </button>
              <button className="act-btn del" onClick={() => onDelete(a.id)}>
                <TrashIcon size={14} /> 삭제
              </button>
            </>
          ) : null}
        </div>

        <div className="comments-label">
          활용 후기 <span>{a.reviews.length}</span>
        </div>
        <div className="reviews-sub">이 에이전트를 실제로 써본 임직원들이 남긴 기록이에요.</div>
        <div>
          {a.reviews.length === 0 ? (
            <div className="c-empty">아직 후기가 없어요. 첫 후기를 남겨보세요.</div>
          ) : (
            a.reviews.map((r) => (
              <div className="comment-item" key={r.id}>
                <div className="comment-head">
                  <div className="c-ava">{r.ava}</div>
                  <span className="c-name">{r.name}</span>
                  <span className="c-dept">{r.dept}</span>
                  <span className="c-date">{r.date}</span>
                </div>
                {r.useCase ? <div className="c-usecase">{r.useCase}</div> : null}
                <div className="c-text">{r.effect}</div>
                {r.timeBefore && r.timeAfter ? (
                  <div className="c-time">
                    {bandLabel(r.timeBefore)} → {bandLabel(r.timeAfter)}
                    {r.savedPct !== null ? ` · 약 ${r.savedPct}% 단축` : ""}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="review-form">
          <div className="rf-title">나도 써봤어요</div>
          <div className="rf-sub">
            이 에이전트를 어떤 업무에 썼고 어떤 효과가 있었는지 남겨주세요. 남겨주신 시간 구간은 전사 절감 시간 집계에
            반영됩니다.
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
            <label>어떤 효과가 있었나요?<span className="req">*</span></label>
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
                  <option key={b.value} value={b.value}>{b.label}</option>
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
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          <div style={{ textAlign: "right", marginTop: 14 }}>
            <button className="btn-primary" onClick={submitReview} disabled={submitting}>
              {submitting ? "등록 중…" : "후기 등록"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
