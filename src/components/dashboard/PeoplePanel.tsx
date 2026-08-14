import type { PersonRow } from "@/lib/dashboard";

const BADGE_LABEL: Record<PersonRow["badges"][number], string> = {
  runs: "실행 1위",
  registrations: "등록 1위",
};

/** 파워 유저 카드 + 임직원 랭킹. 상위만 노출하고 미사용자 명단 같은 건 만들지 않는다. */
export default function PeoplePanel({
  powerUser,
  individuals,
}: {
  powerUser: PersonRow | null;
  individuals: PersonRow[];
}) {
  if (!powerUser || !individuals.length) {
    return <div className="panel-sub">이 기간에는 집계된 활동이 없어요.</div>;
  }

  const max = individuals[0].score;

  return (
    <>
      <div className="power-card">
        <div className="power-ava">{powerUser.ava}</div>
        <div className="power-main">
          <div className="power-name">{powerUser.name}</div>
          <div className="power-dept">{powerUser.team}</div>
          <div className="power-badges">
            {powerUser.badges.map((b) => (
              <span key={b}>{BADGE_LABEL[b]}</span>
            ))}
          </div>
        </div>
        <div className="power-metrics">
          <div>
            <div className="pv">{powerUser.runs}</div>
            <div className="pl">실행</div>
          </div>
          <div>
            <div className="pv">{powerUser.registrations}</div>
            <div className="pl">등록</div>
          </div>
          <div>
            <div className="pv">{powerUser.score}</div>
            <div className="pl">점수</div>
          </div>
        </div>
      </div>

      {individuals.map((r, i) => (
        <div className="rank-item" key={r.id}>
          <span className="rank-no">{i + 1}</span>
          <div className="ava">{r.ava}</div>
          <div className="rank-main">
            <div className="rank-name">
              {r.name} <span className="dept">{r.team}</span>
            </div>
            <div className="rank-sub">
              실행 {r.runs}회 · 등록 {r.registrations}건
            </div>
            <div className="mini-bar">
              <span style={{ width: max > 0 ? `${(r.score / max) * 100}%` : 0 }} />
            </div>
          </div>
          <div className="rank-score">{r.score}</div>
        </div>
      ))}
    </>
  );
}
