"use client";

import { useState } from "react";
import { XIcon, BotIcon } from "@/components/icons";
import type { AgentDraft } from "./AgentFormModal";
import { CATEGORIES, runTypeLabel } from "@/lib/categories";
import { bandLabel } from "@/lib/time-band";
import type { RunType, TimeBand } from "@prisma/client";

type Step = 1 | 2 | 3;

// /api/generate/agent 응답 — 등록 폼을 그대로 채울 수 있는 형태로 받는다.
type Generated = {
  name: string;
  desc: string;
  runType: RunType;
  trigger: string;
  targetTask: string;
  tasks: string[];
  tools: string[];
  effect: string;
  timeBefore: TimeBand;
  timeAfter: TimeBand;
  prerequisites: string[];
  howToUse: string[];
  instructions: string;
};

export default function AgentCreateModal({
  open,
  onClose,
  onUseGenerated,
}: {
  open: boolean;
  onClose: () => void;
  onUseGenerated: (draft: AgentDraft) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [cat, setCat] = useState<string>(CATEGORIES[0]);
  const [task, setTask] = useState("");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStep(1);
    setCat(CATEGORIES[0]);
    setTask("");
    setGenerated(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function runGenerate() {
    if (!task.trim()) {
      setError("어떤 일을 하는 에이전트인지 입력해주세요.");
      return;
    }
    setError(null);
    setStep(2);
    try {
      const res = await fetch("/api/generate/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cat, task: task.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "생성에 실패했어요.");
        setStep(1);
        return;
      }
      setGenerated(data);
      setStep(3);
    } catch {
      setError("네트워크 오류로 생성에 실패했어요.");
      setStep(1);
    }
  }

  if (!open) return null;

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={handleClose}>
          <XIcon size={18} />
        </button>
        <div className="form-title">에이전트 만들기</div>
        <div className="form-sub">어떤 일을 맡기고 싶은지 입력하면, 그 일을 수행하는 에이전트 초안을 만들어드려요.</div>

        {step === 1 ? (
          <>
            <div className="field">
              <label>업무 카테고리</label>
              <select value={cat} onChange={(e) => setCat(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>어떤 일을 하는 에이전트를 만들고 싶으세요?</label>
              <textarea
                rows={4}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="예: 매일 아침 리서치 포털에서 전날 신규 리포트를 모아 팀 브리핑을 만들어 메일로 보내주는 에이전트."
              />
              <div className="hint">맡길 업무·지금 처리 방식·원하는 결과를 적을수록 더 쓸 만한 초안이 만들어져요.</div>
            </div>
            {error ? <div className="form-error">{error}</div> : null}
            <div className="form-actions">
              <button className="btn-ghost" onClick={handleClose}>취소</button>
              <button className="btn-primary" onClick={runGenerate}>에이전트 생성</button>
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <div className="gen-loading">
            <div className="spinner" /> 업무에 맞는 에이전트를 설계하고 있어요…
          </div>
        ) : null}

        {step === 3 && generated ? (
          <>
            <div className="modal-icon-row">
              <div className="agent-icon"><BotIcon size={20} /></div>
              <div>
                <div className="prompt-label" style={{ marginBottom: 2 }}>생성된 에이전트</div>
                <div className="modal-title" style={{ fontSize: 16 }}>{generated.name}</div>
              </div>
            </div>
            <div className="modal-desc">{generated.desc}</div>

            <div className="prompt-label">실행 방식</div>
            <div className="task-chips">
              <span className="task-chip">{runTypeLabel(generated.runType)}</span>
              <span className="task-chip">{generated.trigger}</span>
            </div>

            <div className="prompt-label">스스로 하는 일</div>
            <ol className="step-flow">
              {generated.tasks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>

            <div className="prompt-label">예상 효과</div>
            <div className="sec-body">{generated.effect}</div>
            <div className="effect-box">
              <div className="time-pair">
                <span className="before">{bandLabel(generated.timeBefore)}</span> →{" "}
                <span className="after">{bandLabel(generated.timeAfter)}</span>
              </div>
            </div>

            <div className="gen-note">
              AI가 만든 초안이에요. 소요시간 구간과 사용 순서는 실제에 맞게 꼭 확인·수정한 뒤 등록해주세요.
            </div>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setStep(1)}>처음으로</button>
              <button className="btn-ghost" onClick={runGenerate}>다시 만들기</button>
              <button
                className="btn-primary"
                onClick={() => {
                  onUseGenerated({ ...generated, cat });
                  reset();
                }}
              >
                이 내용으로 등록하기
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
