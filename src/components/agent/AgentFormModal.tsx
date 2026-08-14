"use client";

import { useEffect, useState } from "react";
import { XIcon } from "@/components/icons";
import type { AgentDTO } from "@/lib/agents";
import { CATEGORIES, RUN_TYPES } from "@/lib/categories";
import { TIME_BANDS } from "@/lib/time-band";

export type AgentFormData = {
  cat: string;
  name: string;
  desc: string;
  runType: string;
  trigger: string;
  targetTask: string;
  tasks: string[];
  tools: string[];
  effect: string;
  timeBefore: string;
  timeAfter: string;
  prerequisites: string[];
  howToUse: string[];
  instructions: string;
  linkUrl: string;
};

const EMPTY: AgentFormData = {
  cat: CATEGORIES[0],
  name: "",
  desc: "",
  runType: RUN_TYPES[0].value,
  trigger: "",
  targetTask: "",
  tasks: [],
  tools: [],
  effect: "",
  timeBefore: "",
  timeAfter: "",
  prerequisites: [],
  howToUse: [],
  instructions: "",
  linkUrl: "",
};

const lines = (s: string): string[] => s.split("\n").map((t) => t.trim()).filter(Boolean);

export default function AgentFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: AgentDTO | null;
  onClose: () => void;
  onSubmit: (data: AgentFormData) => Promise<string | null>;
}) {
  const [form, setForm] = useState<AgentFormData>(EMPTY);
  // 줄바꿈 구분 입력은 편집 중 빈 줄을 허용해야 해서 문자열 상태로 따로 둔다.
  const [tasksText, setTasksText] = useState("");
  const [toolsText, setToolsText] = useState("");
  const [prereqText, setPrereqText] = useState("");
  const [howToText, setHowToText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);

    const base: AgentFormData = editing
      ? {
          cat: editing.cat,
          name: editing.name,
          desc: editing.desc === "(설명 없음)" ? "" : editing.desc,
          runType: editing.runType,
          trigger: editing.trigger,
          targetTask: editing.targetTask,
          tasks: editing.tasks,
          tools: editing.tools,
          effect: editing.effect,
          timeBefore: editing.timeBefore ?? "",
          timeAfter: editing.timeAfter ?? "",
          prerequisites: editing.prerequisites,
          howToUse: editing.howToUse,
          instructions: editing.instructions,
          linkUrl: editing.linkUrl ?? "",
        }
      : EMPTY;

    setForm(base);
    setTasksText(base.tasks.join("\n"));
    setToolsText(base.tools.join("\n"));
    setPrereqText(base.prerequisites.join("\n"));
    setHowToText(base.howToUse.join("\n"));
  }, [open, editing]);

  if (!open) return null;

  function set<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    const data: AgentFormData = {
      ...form,
      name: form.name.trim(),
      desc: form.desc.trim(),
      trigger: form.trigger.trim(),
      targetTask: form.targetTask.trim(),
      effect: form.effect.trim(),
      instructions: form.instructions.trim(),
      linkUrl: form.linkUrl.trim(),
      tasks: lines(tasksText),
      tools: lines(toolsText),
      prerequisites: lines(prereqText),
      howToUse: lines(howToText),
    };

    setPending(true);
    setError(null);
    const err = await onSubmit(data);
    setPending(false);
    if (err) setError(err);
  }

  return (
    <div className="overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>
          <XIcon size={18} />
        </button>
        <div className="form-title">{editing ? "에이전트 수정" : "에이전트 등록"}</div>
        <div className="form-sub">
          다른 팀 사람이 읽고 그대로 가져다 쓸 수 있도록, 무슨 업무를 어떻게 줄였는지까지 적어주세요.
        </div>

        <div className="field">
          <label>업무 카테고리<span className="req">*</span></label>
          <select value={form.cat} onChange={(e) => set("cat", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>에이전트 이름<span className="req">*</span></label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="예: 리서치 브리핑 자동 발송 에이전트"
          />
        </div>

        <div className="field">
          <label>설명</label>
          <textarea
            rows={2}
            value={form.desc}
            onChange={(e) => set("desc", e.target.value)}
            placeholder="이 에이전트가 어떤 일을 해주는지 한두 줄로 설명해주세요."
          />
        </div>

        <div className="field">
          <label>실행 방식<span className="req">*</span></label>
          <select value={form.runType} onChange={(e) => set("runType", e.target.value)}>
            {RUN_TYPES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <div className="hint">{RUN_TYPES.find((r) => r.value === form.runType)?.desc}</div>
        </div>

        <div className="field">
          <label>언제 도나요?</label>
          <input
            type="text"
            value={form.trigger}
            onChange={(e) => set("trigger", e.target.value)}
            placeholder="예: 매일 오전 06:30 (평일) / 신규 티켓이 생성될 때마다"
          />
        </div>

        <div className="field">
          <label>이 에이전트가 맡는 업무<span className="req">*</span></label>
          <textarea
            rows={3}
            value={form.targetTask}
            onChange={(e) => set("targetTask", e.target.value)}
            placeholder="도입 전에는 사람이 이 일을 어떻게 처리했고 무엇이 번거로웠는지까지 적어주세요."
          />
          <div className="hint">읽는 사람은 이 업무를 모릅니다. 도입 전 상황을 적어야 효과가 왜 생기는지 전달돼요.</div>
        </div>

        <div className="field">
          <label>에이전트가 스스로 하는 일 (한 줄에 하나씩)<span className="req">*</span></label>
          <textarea
            rows={4}
            value={tasksText}
            onChange={(e) => setTasksText(e.target.value)}
            placeholder={"포털 3곳에서 전날 신규 리포트를 스스로 수집\n같은 종목 리포트를 묶고 의견이 갈리는 건 표시"}
          />
        </div>

        <div className="field">
          <label>연결되는 도구 · 데이터 (한 줄에 하나씩)</label>
          <textarea
            rows={3}
            value={toolsText}
            onChange={(e) => setToolsText(e.target.value)}
            placeholder={"사내 리서치 포털 (조회)\n사내 메일 (발송)"}
          />
        </div>

        <div className="field">
          <label>효과<span className="req">*</span></label>
          <textarea
            rows={3}
            value={form.effect}
            onChange={(e) => set("effect", e.target.value)}
            placeholder="도입 후 무엇이 달라졌는지 적어주세요. 시간뿐 아니라 품질 변화도 좋아요."
          />
        </div>

        <div className="time-row">
          <div className="field">
            <label>기존 소요시간 (1회)</label>
            <select value={form.timeBefore} onChange={(e) => set("timeBefore", e.target.value)}>
              <option value="">선택 안 함</option>
              {TIME_BANDS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
          <div className="sep">→</div>
          <div className="field">
            <label>단축 후 소요시간 (1회)</label>
            <select value={form.timeAfter} onChange={(e) => set("timeAfter", e.target.value)}>
              <option value="">선택 안 함</option>
              {TIME_BANDS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="hint">절감률은 두 구간으로 자동 계산돼요. 직접 적지 않으셔도 됩니다.</div>

        <div className="field">
          <label>미리 준비할 것 (한 줄에 하나씩)</label>
          <textarea
            rows={3}
            value={prereqText}
            onChange={(e) => setPrereqText(e.target.value)}
            placeholder={"사내 리서치 포털 계정 (조회 권한)\n메일 발송용 사내 계정"}
          />
        </div>

        <div className="field">
          <label>사용 순서 (한 줄에 하나씩)</label>
          <textarea
            rows={4}
            value={howToText}
            onChange={(e) => setHowToText(e.target.value)}
            placeholder={"사내 Git 저장소에서 폴더를 내려받아 압축을 풉니다.\nconfig.yaml에서 받을 메일 주소만 바꿔 저장합니다."}
          />
        </div>

        <div className="field">
          <label>에이전트 정의<span className="req">*</span></label>
          <textarea
            rows={6}
            className="mono"
            value={form.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            placeholder="그대로 복사해 쓸 수 있는 에이전트 정의를 적어주세요."
          />
        </div>

        <div className="field">
          <label>바로가기 링크</label>
          <input
            type="text"
            value={form.linkUrl}
            onChange={(e) => set("linkUrl", e.target.value)}
            placeholder="예: https://git.hanwhawm.internal/ai-hub/research-briefing"
          />
        </div>

        {error ? <div className="form-error">{error}</div> : null}

        <div className="form-actions">
          <button className="btn-ghost" onClick={onClose} disabled={pending}>취소</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={pending}>
            {pending ? "저장 중…" : editing ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
